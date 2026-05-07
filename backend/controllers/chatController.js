const { chat, clearContext } = require("../services/chatService");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const { formatINR } = require("../utils/currency");

/* =====================================
  FUZZY PRODUCT FINDER (shared utility)
===================================== */

async function findProduct(name) {
  if (!name) return null;
  const search = name.toLowerCase().trim();
  const products = await Product.find();

  // 1. Exact match
  let match = products.find(p => p.name.toLowerCase() === search);
  if (match) return match;

  // 2. Contains match
  match = products.find(p =>
    p.name.toLowerCase().includes(search) || search.includes(p.name.toLowerCase())
  );
  if (match) return match;

  // 3. Levenshtein fuzzy match
  const scored = products.map(p => {
    const a = search, b = p.name.toLowerCase();
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    if (longer.length === 0) return { product: p, score: 1 };
    const mat = Array.from({ length: shorter.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= longer.length; j++) mat[0][j] = j;
    for (let i = 1; i <= shorter.length; i++) {
      for (let j = 1; j <= longer.length; j++) {
        mat[i][j] = shorter[i - 1] === longer[j - 1]
          ? mat[i - 1][j - 1]
          : 1 + Math.min(mat[i - 1][j - 1], mat[i][j - 1], mat[i - 1][j]);
      }
    }
    return { product: p, score: (longer.length - mat[shorter.length][longer.length]) / longer.length };
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
    const { message, sessionId } = req.body;
    const ai = await chat(message, sessionId);

    if (ai.type === "conversation") {
      return res.json(ai);
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
      return res.json({ type: "command", response: results.join("\n\n") });
    }

    const result = await executeCommand(ai);
    res.json({ type: "command", response: result.response, data: result.data });

  } catch (err) {
    res.status(500).json({ type: "error", response: err.message });
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
  let product = await findProduct(cmd.product_name);

  if (!product) {
    // Auto-create the product if it doesn't exist
    product = await Product.create({
      name: cmd.product_name,
      price: cmd.price || 0,
      quantity: 0,
      minStockLevel: 5
    });
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

  return {
    response: `✅ Added ${cmd.quantity} units to **${product.name}**.\nCurrent stock: ${product.quantity} units | Price: ${formatINR(product.price)} per unit\nTotal value: ${formatINR(product.price * product.quantity)}`,
    data: product
  };
}

async function removeStock(cmd) {
  const product = await findProduct(cmd.product_name);

  if (!product) {
    throw new Error(`❌ Product "${cmd.product_name}" not found. Please check the name or create it first.`);
  }
  if (product.quantity < cmd.quantity) {
    throw new Error(`❌ Insufficient stock! You only have ${product.quantity} ${product.name}(s). Cannot remove ${cmd.quantity}.`);
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

  return {
    response: `✅ Removed ${cmd.quantity} units from **${product.name}**.\nRemaining stock: ${product.quantity} units`,
    data: product
  };
}

async function createProduct(cmd) {
  const existing = await findProduct(cmd.product_name);
  if (existing) {
    throw new Error(`⚠️ "${existing.name}" already exists with ${existing.quantity} units in stock.`);
  }

  const product = await Product.create({
    name: cmd.product_name,
    price: cmd.price || 0,
    quantity: cmd.quantity || 0,
    category: cmd.category || "General",
    minStockLevel: cmd.minStockLevel || 5
  });

  return {
    response: `✅ Product **${product.name}** created successfully!\nPrice: ${formatINR(product.price)} | Initial stock: ${product.quantity} units`,
    data: product
  };
}

async function updateProduct(cmd) {
  const product = await findProduct(cmd.product_name);
  if (!product) {
    throw new Error(`❌ Product "${cmd.product_name}" not found.`);
  }

  if (cmd.price !== undefined) product.price = cmd.price;
  if (cmd.quantity !== undefined) product.quantity = cmd.quantity;
  if (cmd.category !== undefined) product.category = cmd.category;
  if (cmd.minStockLevel !== undefined) product.minStockLevel = cmd.minStockLevel;

  await product.save();
  return {
    response: `✅ Product **${product.name}** updated successfully!\nNew price: ${formatINR(product.price)} | Stock: ${product.quantity} units`,
    data: product
  };
}

async function deleteProduct(cmd) {
  const product = await findProduct(cmd.product_name);
  if (!product) {
    throw new Error(`❌ Product "${cmd.product_name}" not found.`);
  }
  await product.deleteOne();
  return {
    response: `🗑️ Product **${product.name}** has been deleted from inventory.`
  };
}

async function listProducts() {
  const products = await Product.find().sort({ name: 1 });
  if (!products.length) {
    return { response: "📦 No products found in inventory. Create one first!", data: [] };
  }

  const list = products
    .map((p, i) => `${i + 1}. ${p.name} — ${p.quantity} units @ ${formatINR(p.price)}`)
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

  return {
    response: `💰 **Total Inventory Value: ${formatINR(total)}**\n\n📊 ${products.length} products tracked\n🏆 Highest value item: ${topItem?.name || "N/A"} (${formatINR((topItem?.price || 0) * (topItem?.quantity || 0))})`
  };
}

async function viewProduct(cmd) {
  const product = await findProduct(cmd.product_name);
  if (!product) {
    throw new Error(`❌ Product "${cmd.product_name}" not found. Check spelling or use "show inventory" to see all products.`);
  }

  const stockStatus = product.quantity <= product.minStockLevel
    ? "⚠️ LOW STOCK"
    : product.quantity === 0
      ? "🔴 OUT OF STOCK"
      : "✅ In Stock";

  return {
    response: `📦 **${product.name}**\n\nQuantity: ${product.quantity} units\nPrice: ${formatINR(product.price)} per unit\nTotal Value: ${formatINR(product.price * product.quantity)}\nMin Level: ${product.minStockLevel} units\nStatus: ${stockStatus}`,
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
    .map(p => `• ${p.name} — ${p.quantity}/${p.minStockLevel} units (min level)`)
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

  const list = dead.map(p => `• ${p.name} — ${p.quantity} units (${formatINR(p.price * p.quantity)} tied up)`).join("\n");
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

  const list = over.map(p => `• ${p.name} — ${p.quantity} units (min: ${p.minStockLevel})`).join("\n");

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