const { chat, clearContext, translateResponse } = require("../services/chatService");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const { formatINR } = require("../utils/currency");

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

/* =====================================
  FUZZY PRODUCT FINDER (shared utility)
===================================== */

async function findProduct(name, brand = "Generic") {
  if (!name) return null;
  const search = name.toLowerCase().trim();
  const targetBrand = (brand || "Generic").toLowerCase().trim();
  const products = await Product.find();

  // 1. Exact match on both name and brand
  let match = products.find(p => p.name.toLowerCase() === search && p.brand.toLowerCase() === targetBrand);
  if (match) return match;



  // 3. Contains match
  match = products.find(p =>
    (p.name.toLowerCase().includes(search) || search.includes(p.name.toLowerCase())) &&
    (p.brand.toLowerCase() === targetBrand)
  );
  if (match) return match;

  // 4. Levenshtein fuzzy match
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
  if (scored[0]?.score > 0.45) return scored[0].product;

  return null;
}

/* =====================================
  MAIN CHAT ROUTE
===================================== */

exports.chatWithAI = async (req, res) => {
  try {
    const { message, sessionId, lang } = req.body;
    
    let cleanLang = "en";
    if (lang) {
      if (lang.startsWith("mr")) cleanLang = "mr";
      else if (lang.startsWith("hi")) cleanLang = "hi";
      else if (lang.startsWith("en")) cleanLang = "en";
    }

    const ai = await chat(message, sessionId);

    if (ai.type === "conversation") {
      const translatedResponse = await translateResponse(ai.response, cleanLang);
      return res.json({ ...ai, response: translatedResponse });
    }

    if (ai.type === "batch_command") {
      const results = [];
      for (const cmd of ai.commands) {
        try {
          const r = await executeCommand(cmd);
          results.push(r.response);
        } catch (e) {
          results.push(`⚠️ ${e.message}`);
        }
      }
      const rawText = results.join("\n\n");
      const translatedResponse = await translateResponse(rawText, cleanLang);
      return res.json({ type: "command", response: translatedResponse });
    }

    try {
      const result = await executeCommand(ai);
      const translatedResponse = await translateResponse(result.response, cleanLang);
      res.json({ type: "command", response: translatedResponse, data: result.data });
    } catch (e) {
      const translatedError = await translateResponse(e.message, cleanLang);
      res.json({ type: "error", response: translatedError });
    }

  } catch (err) {
    const requestedLang = req.body.lang ? (req.body.lang.startsWith("mr") ? "mr" : (req.body.lang.startsWith("hi") ? "hi" : "en")) : "en";
    const translatedError = await translateResponse(err.message, requestedLang);
    res.status(500).json({ type: "error", response: translatedError });
  }
};

/* =====================================
  COMMAND ROUTER
===================================== */

async function executeCommand(command) {
  switch (command.action) {
    case "add_stock": return addStock(command);
    case "remove_stock": return removeStock(command);
    case "create_product": return createProduct(command);
    case "update_product": return updateProduct(command);
    case "delete_product": return deleteProduct(command);
    case "list_products": return listProducts();
    case "inventory_value": return inventoryValue();
    case "view_product": return viewProduct(command);
    case "low_stock": return getLowStock();
    case "dead_stock": return getDeadStock();
    case "overstock": return getOverstock();
    default:
      throw new Error("Unknown command: " + command.action);
  }
}

/* =====================================
  COMMAND IMPLEMENTATIONS
===================================== */

async function addStock(cmd) {
  let product = await findProduct(cmd.product_name, cmd.brand || "Generic");

  if (!product) {
    throw new Error(`❌ Product "${cmd.brand && cmd.brand !== 'Generic' ? cmd.brand + ' ' : ''}${cmd.product_name}" does not exist. Please create the product first with a valid price and initial stock.`);
  } else if (cmd.price && cmd.price > 0) {
    // Update price if provided
    product.price = cmd.price;
  }

  const prev = product.quantity;
  product.quantity += Number(cmd.quantity);
  await product.save();

  await Transaction.create({
    product: product._id,
    type: "add",
    quantity: cmd.quantity,
    previousQuantity: prev,
    newQuantity: product.quantity
  });

  const fullName = product.brand && product.brand !== "Generic" ? `${product.brand} ${product.name}` : product.name;
  return {
    response: `✅ Added ${cmd.quantity} units to **${fullName}**.\nCurrent stock: ${product.quantity} units | Price: ${formatINR(product.price)} per unit\nTotal value: ${formatINR(product.price * product.quantity)}`,
    data: product
  };
}

async function removeStock(cmd) {
  const product = await findProduct(cmd.product_name, cmd.brand || "Generic");

  if (!product) {
    throw new Error(`❌ Product "${cmd.brand && cmd.brand !== 'Generic' ? cmd.brand + ' ' : ''}${cmd.product_name}" not found. Please check the name or create it first.`);
  }
  if (product.quantity < cmd.quantity) {
    const fullName = product.brand && product.brand !== "Generic" ? `${product.brand} ${product.name}` : product.name;
    throw new Error(`❌ Insufficient stock! You only have ${product.quantity} ${fullName}(s). Cannot remove ${cmd.quantity}.`);
  }

  const prev = product.quantity;
  product.quantity -= Number(cmd.quantity);
  await product.save();

  await Transaction.create({
    product: product._id,
    type: "remove",
    quantity: cmd.quantity,
    previousQuantity: prev,
    newQuantity: product.quantity
  });

  const fullName = product.brand && product.brand !== "Generic" ? `${product.brand} ${product.name}` : product.name;
  return {
    response: `✅ Removed ${cmd.quantity} units from **${fullName}**.\nRemaining stock: ${product.quantity} units`,
    data: product
  };
}

async function createProduct(cmd) {
  const existing = await findProduct(cmd.product_name, cmd.brand || "Generic");
  if (existing) {
    const fullName = existing.brand && existing.brand !== "Generic" ? `${existing.brand} ${existing.name}` : existing.name;
    throw new Error(`⚠️ "${fullName}" already exists with ${existing.quantity} units in stock.`);
  }

  const catId = await resolveCategory(cmd.category || "General");

  const product = await Product.create({
    name: cmd.product_name,
    brand: cmd.brand || "Generic",
    price: cmd.price || 0,
    quantity: cmd.quantity || 0,
    category: catId,
    minStockLevel: cmd.minStockLevel || 10
  });

  const fullName = product.brand && product.brand !== "Generic" ? `${product.brand} ${product.name}` : product.name;
  return {
    response: `✅ Product **${fullName}** created successfully!\nPrice: ${formatINR(product.price)} | Initial stock: ${product.quantity} units`,
    data: product
  };
}

async function updateProduct(cmd) {
  const product = await findProduct(cmd.product_name, cmd.brand || "Generic");
  if (!product) {
    throw new Error(`❌ Product "${cmd.brand && cmd.brand !== 'Generic' ? cmd.brand + ' ' : ''}${cmd.product_name}" not found.`);
  }

  if (cmd.brand !== undefined && cmd.brand !== "Generic") product.brand = cmd.brand;
  if (cmd.price !== undefined) product.price = cmd.price;
  if (cmd.quantity !== undefined) product.quantity = cmd.quantity;
  if (cmd.category !== undefined) {
    product.category = await resolveCategory(cmd.category);
  }
  if (cmd.minStockLevel !== undefined) product.minStockLevel = cmd.minStockLevel;

  await product.save();
  const fullName = product.brand && product.brand !== "Generic" ? `${product.brand} ${product.name}` : product.name;
  return {
    response: `✅ Product **${fullName}** updated successfully!\nNew price: ${formatINR(product.price)} | Stock: ${product.quantity} units`,
    data: product
  };
}

async function deleteProduct(cmd) {
  const product = await findProduct(cmd.product_name, cmd.brand || "Generic");
  if (!product) {
    throw new Error(`❌ Product "${cmd.brand && cmd.brand !== 'Generic' ? cmd.brand + ' ' : ''}${cmd.product_name}" not found.`);
  }
  await product.deleteOne();
  const fullName = product.brand && product.brand !== "Generic" ? `${product.brand} ${product.name}` : product.name;
  return {
    response: `🗑️ Product **${fullName}** has been deleted from inventory.`
  };
}

async function listProducts() {
  const products = await Product.find().sort({ name: 1 });
  if (!products.length) {
    return { response: "📦 No products found in inventory. Create one first!", data: [] };
  }

  const list = products
    .map((p, i) => {
      const displayName = p.brand && p.brand !== "Generic" ? `[${p.brand}] ${p.name}` : p.name;
      return `${i + 1}. ${displayName} — ${p.quantity} units @ ${formatINR(p.price)}`;
    })
    .join("\n");

  const total = products.reduce((s, p) => s + p.price * p.quantity, 0);

  return {
    response: `📦 **Inventory (${products.length} products):**\n\n${list}\n\n💰 Total Value: ${formatINR(total)}`,
    data: products
  };
}

async function inventoryValue() {
  const products = await Product.find();
  const total = products.reduce((s, p) => s + p.price * p.quantity, 0);
  const topItem = products.sort((a, b) => b.price * b.quantity - a.price * a.quantity)[0];
  const topItemName = topItem ? (topItem.brand && topItem.brand !== "Generic" ? `${topItem.brand} ${topItem.name}` : topItem.name) : "N/A";

  return {
    response: `💰 **Total Inventory Value: ${formatINR(total)}**\n\n📊 ${products.length} products tracked\n🏆 Highest value item: ${topItemName} (${formatINR((topItem?.price || 0) * (topItem?.quantity || 0))})`
  };
}

async function viewProduct(cmd) {
  const product = await findProduct(cmd.product_name, cmd.brand || "Generic");
  if (!product) {
    throw new Error(`❌ Product "${cmd.brand && cmd.brand !== 'Generic' ? cmd.brand + ' ' : ''}${cmd.product_name}" not found. Check spelling or use "show inventory" to see all products.`);
  }

  const stockStatus = product.quantity <= product.minStockLevel
    ? "⚠️ LOW STOCK"
    : product.quantity === 0
      ? "🔴 OUT OF STOCK"
      : "✅ In Stock";

  const fullName = product.brand && product.brand !== "Generic" ? `${product.brand} ${product.name}` : product.name;
  return {
    response: `📦 **${fullName}**\n\nQuantity: ${product.quantity} units\nPrice: ${formatINR(product.price)} per unit\nTotal Value: ${formatINR(product.price * product.quantity)}\nMin Level: ${product.minStockLevel} units\nStatus: ${stockStatus}`,
    data: product
  };
}

async function getLowStock() {
  const products = await Product.find({
    $expr: { $lte: ["$quantity", "$minStockLevel"] }
  });

  if (!products.length) {
    return { response: "✅ All products are sufficiently stocked. No low stock alerts!" };
  }

  const list = products
    .map(p => {
      const fullName = p.brand && p.brand !== "Generic" ? `${p.brand} ${p.name}` : p.name;
      return `• ${fullName} — ${p.quantity}/${p.minStockLevel} units (min level)`;
    })
    .join("\n");

  return {
    response: `⚠️ **${products.length} Low Stock Item(s):**\n\n${list}\n\nConsider restocking these items soon.`,
    data: products
  };
}

async function getDeadStock() {
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentTxns = await Transaction.find({ createdAt: { $gte: last30Days } });
  const movedIds = new Set(recentTxns.map(t => String(t.product)));
  const allProducts = await Product.find();
  const dead = allProducts.filter(p => !movedIds.has(String(p._id)));

  if (!dead.length) {
    return { response: "✅ No dead stock! All your products have had movement in the last 30 days." };
  }

  const list = dead.map(p => {
    const fullName = p.brand && p.brand !== "Generic" ? `${p.brand} ${p.name}` : p.name;
    return `• ${fullName} — ${p.quantity} units (${formatINR(p.price * p.quantity)} tied up)`;
  }).join("\n");
  const totalTiedUp = dead.reduce((s, p) => s + p.price * p.quantity, 0);

  return {
    response: `🕒 **Dead Stock (No movement in 30 days) — ${dead.length} items:**\n\n${list}\n\n💸 Total capital tied up: ${formatINR(totalTiedUp)}`,
    data: dead
  };
}

async function getOverstock() {
  const products = await Product.find();
  const over = products.filter(p => p.quantity > p.minStockLevel * 5);

  if (!over.length) {
    return { response: "✅ No overstock issues detected." };
  }

  const list = over.map(p => {
    const fullName = p.brand && p.brand !== "Generic" ? `${p.brand} ${p.name}` : p.name;
    return `• ${fullName} — ${p.quantity} units (min: ${p.minStockLevel})`;
  }).join("\n");

  return {
    response: `📦 **Overstocked Items (${over.length}):**\n\n${list}\n\nConsider reducing orders or running promotions for these products.`,
    data: over
  };
}

/* =====================================
  CLEAR CHAT
===================================== */

exports.clearChat = async (req, res) => {
  const { sessionId } = req.body;
  clearContext(sessionId);
  res.json({ message: "Chat cleared" });
};