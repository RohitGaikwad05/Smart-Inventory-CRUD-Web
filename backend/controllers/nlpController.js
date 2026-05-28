const { processCommand, findBestMatchProduct } = require('../services/nlpService');
const { translateResponse } = require('../services/chatService');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { checkAndCreateAlert } = require('../services/alertService');
const { formatINR } = require('../utils/currency');

async function resolveCategory(categoryName) {
  if (!categoryName) return null;
  if (/^[0-9a-fA-F]{24}$/.test(categoryName)) {
    return categoryName;
  }
  const cleanName = categoryName.trim();
  if (!cleanName) return null;
  try {
    let cat = await Category.findOne({ name: { $regex: new RegExp(`^${cleanName}$`, "i") } });
    if (!cat) {
      cat = await Category.create({ name: cleanName });
    }
    return cat._id;
  } catch (err) {
    console.error("Error resolving category:", err);
    return null;
  }
}

exports.processVoiceCommand = async (req, res) => {
  try {
    const { command, lang } = req.body;
    
    let cleanLang = "en";
    if (lang) {
      if (lang.startsWith("mr")) cleanLang = "mr";
      else if (lang.startsWith("hi")) cleanLang = "hi";
      else if (lang.startsWith("en")) cleanLang = "en";
    }

    const intent = await processCommand(command);

    let result;
    switch (intent.action) {
      case 'add_stock':
        result = await handleAddStock(intent, command);
        break;
      case 'remove_stock':
        result = await handleRemoveStock(intent, command);
        break;
      case 'view_product':
        result = await handleViewProduct(intent);
        break;
      case 'list_products':
        result = await handleListProducts(intent);
        break;
      case 'create_product':
        result = await handleCreateProduct(intent);
        break;
      case 'update_product':
        result = await handleUpdateProduct(intent);
        break;
      case 'delete_product':
        result = await handleDeleteProduct(intent);
        break;
      case 'low_stock':
        result = await handleLowStock();
        break;
      case 'inventory_value':
        result = await handleInventoryValue();
        break;
      case 'dead_stock':
        result = await handleDeadStock();
        break;
      case 'overstock':
        result = await handleOverstock();
        break;
      default:
        const defaultMsg = `Command "${intent.action}" not understood. Try: add stock, remove stock, create product, show inventory, check inventory value, low stock, dead stock.`;
        const translatedDefault = await translateResponse(defaultMsg, cleanLang);
        return res.status(400).json({ message: translatedDefault });
    }

    const rawResponse = generateResponse(intent, result);
    const translatedResponse = await translateResponse(rawResponse, cleanLang);

    res.json({ intent, result, response: translatedResponse });
  } catch (error) {
    const requestedLang = req.body.lang ? (req.body.lang.startsWith("mr") ? "mr" : (req.body.lang.startsWith("hi") ? "hi" : "en")) : "en";
    const translatedError = await translateResponse(error.message, requestedLang);
    res.status(500).json({ message: translatedError });
  }
};

/* ─────────────────── HANDLERS ─────────────────── */

const handleAddStock = async (intent, commandText) => {
  let product = intent.matched_product
    ? await Product.findById(intent.matched_product._id)
    : await findProduct(intent.product_name, intent.brand || "Generic");

  if (!product) {
    throw new Error(`Product "${fullName}" does not exist. Please create the product first with a valid price and initial stock.`);
  } else if (intent.price && intent.price > 0) {
    product.price = intent.price;
  }

  const previousQuantity = product.quantity;
  product.quantity += Number(intent.quantity);
  await product.save();

  await Transaction.create({
    product: product._id,
    type: 'add',
    quantity: intent.quantity,
    previousQuantity,
    newQuantity: product.quantity,
    commandText
  });

  await checkAndCreateAlert(product);
  return product;
};

const handleRemoveStock = async (intent, commandText) => {
  let product = intent.matched_product
    ? await Product.findById(intent.matched_product._id)
    : await findProduct(intent.product_name, intent.brand || "Generic");

  const fullName = product ? (product.brand && product.brand !== 'Generic' ? `${product.brand} ${product.name}` : product.name) : intent.product_name;
  if (!product) throw new Error(`Product "${fullName}" not found. Please create it first.`);
  if (product.quantity < intent.quantity) {
    throw new Error(`Insufficient stock. Current: ${product.quantity}, Requested: ${intent.quantity}`);
  }

  const previousQuantity = product.quantity;
  product.quantity -= Number(intent.quantity);
  await product.save();

  await Transaction.create({
    product: product._id,
    type: 'remove',
    quantity: intent.quantity,
    previousQuantity,
    newQuantity: product.quantity,
    commandText
  });

  await checkAndCreateAlert(product);
  return product;
};

const handleViewProduct = async (intent) => {
  const product = intent.matched_product
    ? await Product.findById(intent.matched_product._id)
    : await findProduct(intent.product_name, intent.brand || "Generic");
  const fullName = intent.brand && intent.brand !== 'Generic' ? `${intent.brand} ${intent.product_name}` : intent.product_name;
  if (!product) throw new Error(`Product "${fullName}" not found.`);
  return product;
};

const handleListProducts = async (intent) => {
  const query = intent.category ? { category: intent.category } : {};
  return await Product.find(query).sort({ name: 1 }).limit(50);
};

const handleCreateProduct = async (intent) => {
  const existing = await findProduct(intent.product_name, intent.brand || "Generic");
  const fullName = intent.brand && intent.brand !== 'Generic' ? `${intent.brand} ${intent.product_name}` : intent.product_name;
  if (existing) throw new Error(`"${fullName}" already exists in inventory.`);

  const catId = await resolveCategory(intent.category || 'General');

  const product = await Product.create({
    name: intent.product_name,
    brand: intent.brand || 'Generic',
    price: intent.price || 0,
    quantity: intent.quantity || 0,
    category: catId,
    minStockLevel: intent.minStockLevel || 10
  });
  await checkAndCreateAlert(product);
  return product;
};

const handleUpdateProduct = async (intent) => {
  const product = intent.matched_product
    ? await Product.findById(intent.matched_product._id)
    : await findProduct(intent.product_name, intent.brand || "Generic");
  const fullName = intent.brand && intent.brand !== 'Generic' ? `${intent.brand} ${intent.product_name}` : intent.product_name;
  if (!product) throw new Error(`Product "${fullName}" not found.`);

  if (intent.brand !== undefined && intent.brand !== "Generic") product.brand = intent.brand;
  if (intent.price !== undefined)         product.price = intent.price;
  if (intent.quantity !== undefined)      product.quantity = intent.quantity;
  if (intent.category !== undefined) {
    product.category = await resolveCategory(intent.category);
  }
  if (intent.minStockLevel !== undefined) product.minStockLevel = intent.minStockLevel;

  await product.save();
  return product;
};

const handleDeleteProduct = async (intent) => {
  const product = intent.matched_product
    ? await Product.findById(intent.matched_product._id)
    : await findProduct(intent.product_name, intent.brand || "Generic");
  const fullName = intent.brand && intent.brand !== 'Generic' ? `${intent.brand} ${intent.product_name}` : intent.product_name;
  if (!product) throw new Error(`Product "${fullName}" not found.`);
  await product.deleteOne();
  return product;
};

const handleLowStock = async () => {
  return await Product.find({ $expr: { $lte: ['$quantity', '$minStockLevel'] } });
};

const handleInventoryValue = async () => {
  const products = await Product.find();
  const total = products.reduce((s, p) => s + p.price * p.quantity, 0);
  return { total, count: products.length };
};

const handleDeadStock = async () => {
  const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = await Transaction.find({ createdAt: { $gte: last30 } });
  const movedIds = new Set(recent.map(t => String(t.product)));
  const all = await Product.find();
  return all.filter(p => !movedIds.has(String(p._id)));
};

const handleOverstock = async () => {
  const products = await Product.find();
  return products.filter(p => p.quantity > p.minStockLevel * 5);
};

/* ─────────────────── RESPONSE GENERATOR ─────────────────── */

const generateResponse = (intent, result) => {
  const name = intent.matched_product
    ? `${intent.product_name} (matched from "${intent.original_name}")`
    : intent.product_name;

  switch (intent.action) {
    case 'add_stock':
      return `Added ${intent.quantity} units to ${name}. New stock: ${result.quantity} units @ ${formatINR(result.price)} each.`;

    case 'remove_stock':
      return `Removed ${intent.quantity} units from ${name}. Remaining: ${result.quantity} units.`;

    case 'view_product':
      if (!result) return 'Product not found.';
      const status = result.quantity <= result.minStockLevel ? '⚠️ Low Stock' : '✅ In Stock';
      const viewName = result.brand && result.brand !== "Generic" ? `${result.brand} ${result.name}` : result.name;
      return `${viewName}: ${result.quantity} units at ${formatINR(result.price)} each. Total value: ${formatINR(result.price * result.quantity)}. Status: ${status}`;

    case 'list_products':
      if (!result.length) return 'No products in inventory.';
      const list = result.map((p, i) => {
        const fullName = p.brand && p.brand !== "Generic" ? `${p.brand} ${p.name}` : p.name;
        return `${i + 1}. ${fullName} — ${p.quantity} units @ ${formatINR(p.price)}`;
      }).join(', ');
      return `Found ${result.length} products: ${list}`;

    case 'create_product':
      const createName = result.brand && result.brand !== "Generic" ? `${result.brand} ${result.name}` : result.name;
      return `Created product: ${createName} at ${formatINR(result.price)} with ${result.quantity} units initial stock.`;

    case 'update_product':
      const updateName = result.brand && result.brand !== "Generic" ? `${result.brand} ${result.name}` : result.name;
      return `Updated ${updateName}. New price: ${formatINR(result.price)}, Stock: ${result.quantity} units.`;

    case 'delete_product':
      const deleteName = result.brand && result.brand !== "Generic" ? `${result.brand} ${result.name}` : result.name;
      return `Product "${deleteName}" deleted from inventory.`;

    case 'low_stock':
      if (!result.length) return 'All products are sufficiently stocked. No alerts!';
      const lowList = result.map(p => {
        const fullName = p.brand && p.brand !== "Generic" ? `${p.brand} ${p.name}` : p.name;
        return `${fullName} (${p.quantity} units)`;
      }).join(', ');
      return `${result.length} low stock item(s): ${lowList}. Consider restocking soon.`;

    case 'inventory_value':
      return `Your total inventory value is ${formatINR(result.total)} across ${result.count} products.`;

    case 'dead_stock':
      if (!result.length) return 'No dead stock! All products have had movement in the last 30 days.';
      const deadList = result.map(p => {
        const fullName = p.brand && p.brand !== "Generic" ? `${p.brand} ${p.name}` : p.name;
        return fullName;
      }).join(', ');
      return `${result.length} dead stock item(s): ${deadList}. These products haven't moved in 30 days.`;

    case 'overstock':
      if (!result.length) return 'No overstock issues detected.';
      const overList = result.map(p => {
        const fullName = p.brand && p.brand !== "Generic" ? `${p.brand} ${p.name}` : p.name;
        return `${fullName} (${p.quantity} units)`;
      }).join(', ');
      return `${result.length} overstocked item(s): ${overList}.`;

    default:
      return 'Command processed successfully.';
  }
};

/* ─────────────────── FUZZY MATCH HELPER ─────────────────── */

async function findProduct(name, brand = "Generic") {
  if (!name) return null;
  const search = name.toLowerCase().trim();
  const targetBrand = (brand || "Generic").toLowerCase().trim();
  const products = await Product.find();

  // 1. Exact match on name and brand
  let match = products.find(p => p.name.toLowerCase() === search && p.brand.toLowerCase() === targetBrand);
  if (match) return match;



  // 3. Contains match
  match = products.find(p =>
    (p.name.toLowerCase().includes(search) || search.includes(p.name.toLowerCase())) &&
    (p.brand.toLowerCase() === targetBrand)
  );
  if (match) return match;

  // 4. Fuzzy match
  const scored = products.map(p => {
    const a = search, b = p.name.toLowerCase();
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    let nameScore = 1.0;
    if (longer.length > 0) {
      const mat = Array.from({ length: shorter.length + 1 }, (_, i) => [i]);
      for (let j = 0; j <= longer.length; j++) mat[0][j] = j;
      for (let i = 1; i <= shorter.length; i++) {
        for (let j = 1; j <= longer.length; j++) {
          mat[i][j] = shorter[i - 1] === longer[j - 1]
            ? mat[i - 1][j - 1]
            : 1 + Math.min(mat[i - 1][j - 1], mat[i][j - 1], mat[i - 1][j]);
        }
      }
      nameScore = (longer.length - mat[shorter.length][longer.length]) / longer.length;
    }
    
    let brandScore = 1.0;
    if (targetBrand !== "generic") {
      const ba = targetBrand, bb = p.brand.toLowerCase();
      const blonger = ba.length > bb.length ? ba : bb;
      const bshorter = ba.length > bb.length ? bb : ba;
      if (blonger.length > 0) {
        const bmat = Array.from({ length: bshorter.length + 1 }, (_, i) => [i]);
        for (let j = 0; j <= blonger.length; j++) bmat[0][j] = j;
        for (let i = 1; i <= bshorter.length; i++) {
          for (let j = 1; j <= blonger.length; j++) {
            bmat[i][j] = bshorter[i - 1] === blonger[j - 1]
              ? bmat[i - 1][j - 1]
              : 1 + Math.min(bmat[i - 1][j - 1], bmat[i][j - 1], bmat[i - 1][j]);
          }
        }
        brandScore = (blonger.length - bmat[bshorter.length][blonger.length]) / blonger.length;
      }
    }
    
    if (targetBrand !== "generic" && (p.brand.toLowerCase() === "generic" || brandScore < 0.7)) {
      return { product: p, score: 0 };
    }
    
    return { product: p, score: (nameScore * 0.7) + (brandScore * 0.3) };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0.45 ? scored[0].product : null;
}
