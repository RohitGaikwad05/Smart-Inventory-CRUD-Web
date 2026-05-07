const { processCommand } = require('../services/nlpService');
const { findBestMatchProduct } = require('../services/nlpService');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const { checkAndCreateAlert } = require('../services/alertService');
const { formatINR } = require('../utils/currency');

exports.processVoiceCommand = async (req, res) => {
  try {
    const { command } = req.body;
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
        return res.status(400).json({ message: `Command "${intent.action}" not understood. Try: add stock, remove stock, create product, show inventory, check inventory value, low stock, dead stock.` });
    }

    res.json({ intent, result, response: generateResponse(intent, result) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─────────────────── HANDLERS ─────────────────── */

const handleAddStock = async (intent, commandText) => {
  let product = intent.matched_product
    ? await Product.findById(intent.matched_product._id)
    : await findProduct(intent.product_name);

  if (!product) {
    // Auto-create if not found
    product = await Product.create({
      name: intent.product_name,
      price: intent.price || 0,
      quantity: 0,
      minStockLevel: 5
    });
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
    : await findProduct(intent.product_name);

  if (!product) throw new Error(`Product "${intent.product_name}" not found. Please create it first.`);
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
    : await findProduct(intent.product_name);
  if (!product) throw new Error(`Product "${intent.product_name}" not found.`);
  return product;
};

const handleListProducts = async (intent) => {
  const query = intent.category ? { category: intent.category } : {};
  return await Product.find(query).sort({ name: 1 }).limit(50);
};

const handleCreateProduct = async (intent) => {
  const existing = await findProduct(intent.product_name);
  if (existing) throw new Error(`"${existing.name}" already exists in inventory.`);

  const product = await Product.create({
    name: intent.product_name,
    price: intent.price || 0,
    quantity: intent.quantity || 0,
    category: intent.category || 'General',
    minStockLevel: intent.minStockLevel || 5
  });
  await checkAndCreateAlert(product);
  return product;
};

const handleUpdateProduct = async (intent) => {
  const product = intent.matched_product
    ? await Product.findById(intent.matched_product._id)
    : await findProduct(intent.product_name);
  if (!product) throw new Error(`Product "${intent.product_name}" not found.`);

  if (intent.price !== undefined)         product.price = intent.price;
  if (intent.quantity !== undefined)      product.quantity = intent.quantity;
  if (intent.category !== undefined)      product.category = intent.category;
  if (intent.minStockLevel !== undefined) product.minStockLevel = intent.minStockLevel;

  await product.save();
  return product;
};

const handleDeleteProduct = async (intent) => {
  const product = intent.matched_product
    ? await Product.findById(intent.matched_product._id)
    : await findProduct(intent.product_name);
  if (!product) throw new Error(`Product "${intent.product_name}" not found.`);
  await product.deleteOne();
  return { name: product.name, deleted: true };
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
      return `${result.name}: ${result.quantity} units at ${formatINR(result.price)} each. Total value: ${formatINR(result.price * result.quantity)}. Status: ${status}`;

    case 'list_products':
      if (!result.length) return 'No products in inventory.';
      const list = result.map((p, i) => `${i + 1}. ${p.name} — ${p.quantity} units @ ${formatINR(p.price)}`).join(', ');
      return `Found ${result.length} products: ${list}`;

    case 'create_product':
      return `Created product: ${result.name} at ${formatINR(result.price)} with ${result.quantity} units initial stock.`;

    case 'update_product':
      return `Updated ${result.name}. New price: ${formatINR(result.price)}, Stock: ${result.quantity} units.`;

    case 'delete_product':
      return `Product "${result.name}" deleted from inventory.`;

    case 'low_stock':
      if (!result.length) return 'All products are sufficiently stocked. No alerts!';
      return `${result.length} low stock item(s): ${result.map(p => `${p.name} (${p.quantity} units)`).join(', ')}. Consider restocking soon.`;

    case 'inventory_value':
      return `Your total inventory value is ${formatINR(result.total)} across ${result.count} products.`;

    case 'dead_stock':
      if (!result.length) return 'No dead stock! All products have had movement in the last 30 days.';
      return `${result.length} dead stock item(s): ${result.map(p => p.name).join(', ')}. These products haven't moved in 30 days.`;

    case 'overstock':
      if (!result.length) return 'No overstock issues detected.';
      return `${result.length} overstocked item(s): ${result.map(p => `${p.name} (${p.quantity} units)`).join(', ')}.`;

    default:
      return 'Command processed successfully.';
  }
};

/* ─────────────────── FUZZY MATCH HELPER ─────────────────── */

async function findProduct(name) {
  if (!name) return null;
  const search = name.toLowerCase().trim();
  const products = await Product.find();

  let match = products.find(p => p.name.toLowerCase() === search);
  if (match) return match;

  match = products.find(p =>
    p.name.toLowerCase().includes(search) || search.includes(p.name.toLowerCase())
  );
  if (match) return match;

  const scored = products.map(p => {
    const a = search, b = p.name.toLowerCase();
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    if (longer.length === 0) return { product: p, score: 1 };
    const mat = Array.from({ length: shorter.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= longer.length; j++) mat[0][j] = j;
    for (let i = 1; i <= shorter.length; i++) {
      for (let j = 1; j <= longer.length; j++) {
        mat[i][j] = shorter[i-1] === longer[j-1]
          ? mat[i-1][j-1]
          : 1 + Math.min(mat[i-1][j-1], mat[i][j-1], mat[i-1][j]);
      }
    }
    return { product: p, score: (longer.length - mat[shorter.length][longer.length]) / longer.length };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0.45 ? scored[0].product : null;
}
