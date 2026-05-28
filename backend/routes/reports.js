const express = require('express');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const { getAlerts, dismissAlert } = require('../services/alertService');
const { generateReport } = require('../services/reportService');

const router = express.Router();

const parseDateRange = (req) => {
  let startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  let endDate = new Date();

  if (req.query.startDate) {
    startDate = new Date(req.query.startDate);
  }
  if (req.query.endDate) {
    endDate = new Date(req.query.endDate);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

router.get('/dashboard', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const lowStockCount = await Product.countDocuments({ $expr: { $lte: ['$quantity', '$minStockLevel'] } });
    const stockValue = await Product.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$price'] } } } }
    ]);
    const recentTransactions = await Transaction.find()
      .sort('-createdAt')
      .limit(10)
      .populate('product user');

    const products = await Product.find();
    const last30Days = new Date(Date.now() - 30*24*60*60*1000);
    const recentTrans = await Transaction.find({ createdAt: { $gte: last30Days } });
    const movedIds = new Set(recentTrans.map(t=>String(t.product)));

    const deadStockCount = products.filter(p=> !movedIds.has(String(p._id))).length;
    const overStockCount = products.filter(p=> p.quantity > p.minStockLevel * 5).length;

    // Standardized health score logic
    const deadPenalty    = Math.min(deadStockCount * 4, 40);
    const lowStockPenalty  = Math.min(lowStockCount * 3, 30);
    const overStockPenalty = Math.min(overStockCount * 2, 20);
    const healthScore = Math.max(0, 100 - deadPenalty - lowStockPenalty - overStockPenalty);

    // Fetch details of low stock products
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    }).limit(10);

    // Fetch high demand products (aggregated from removals/sales in the last 30 days)
    const demandAggregate = await Transaction.aggregate([
      {
        $match: {
          type: 'remove',
          createdAt: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: '$product',
          totalDemanded: { $sum: '$quantity' }
        }
      },
      {
        $sort: { totalDemanded: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const highDemandProducts = [];
    for (const item of demandAggregate) {
      const prod = await Product.findById(item._id);
      if (prod) {
        highDemandProducts.push({
          _id: prod._id,
          name: prod.name,
          brand: prod.brand || 'Generic',
          totalDemanded: item.totalDemanded,
          quantity: prod.quantity
        });
      }
    }

    res.json({
      totalProducts,
      lowStockCount,
      stockValue: stockValue[0]?.total || 0,
      recentTransactions,
      healthScore,
      lowStockProducts,
      highDemandProducts
    });



  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/generate', async (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const report = await generateReport(lang);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/transactions', async (req, res) => {

  try {

    const { productId, startDate, endDate } = req.query;

    const query = {};

    if (productId) query.product = productId;

    if (startDate || endDate) {

      query.createdAt = {};

      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);

    }

    const transactions = await Transaction.find(query)
      .sort('-createdAt')
      .populate('product user');

    res.json(transactions);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

});

router.get('/alerts', async (req, res) => {

  try {

    const alerts = await getAlerts();

    res.json(alerts);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

});

router.put('/alerts/:id/dismiss', async (req, res) => {

  try {

    await dismissAlert(req.params.id);

    res.json({ message: 'Alert dismissed' });

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

});

router.get('/analytics', async (req,res)=>{

  try{
    const { startDate, endDate } = parseDateRange(req);

    const products = await Product.find();
    const recentTrans = await Transaction.find({ createdAt: { $gte: startDate, $lte: endDate } });
    const movedIds = new Set(recentTrans.map(t=>String(t.product)));

    const deadStock = products.filter(p=>{
      return !movedIds.has(String(p._id));
    });

    const totalValue = products.reduce((s,p)=>s+p.price*p.quantity,0);
    const lowStock = products.filter(p=>p.quantity <= p.minStockLevel);

    res.json({
      totalProducts:products.length,
      totalValue,
      lowStock:lowStock.length,
      deadStock:deadStock.length
    });

  }catch(err){
    res.status(500).json({message:err.message});
  }

});


/* NEW ADVANCED ANALYTICS */

router.get('/advanced-analytics', async (req,res)=>{

  try{
    const { startDate, endDate } = parseDateRange(req);

    const products = await Product.find();
    const transactions = await Transaction.find({ createdAt: { $gte: startDate, $lte: endDate } });
    const allTransactions = await Transaction.find();

    const productMovement = {};
    transactions.forEach(t=>{
      const id = String(t.product);
      if(!productMovement[id]) productMovement[id]=0;
      productMovement[id]+=t.quantity;
    });

    const fastMoving = products
      .map(p=>({
        name: p.brand && p.brand !== 'Generic' ? `${p.brand} ${p.name}` : p.name,
        movement:productMovement[String(p._id)] || 0
      }))
      .sort((a,b)=>b.movement-a.movement)
      .slice(0,5);

    // Dead stock = no movement in last 30 days
    const movedIds = new Set(transactions.map(t=>String(t.product)));
    const deadStock = products.filter(p=> !movedIds.has(String(p._id)));

    // Low stock items
    const lowStock = products.filter(p=> p.quantity <= p.minStockLevel);

    // Overstock items (quantity > 5x minimum level)
    const overStock = products.filter(p=> p.quantity > p.minStockLevel * 5);

    // Multi-factor health score
    const deadPenalty    = Math.min(deadStock.length * 4, 40);   // max 40pts off
    const lowStockPenalty  = Math.min(lowStock.length * 3, 30);  // max 30pts off
    const overStockPenalty = Math.min(overStock.length * 2, 20); // max 20pts off
    const healthScore = Math.max(0, 100 - deadPenalty - lowStockPenalty - overStockPenalty);

    res.json({
      fastMoving,
      deadStock:deadStock.map(p=>({
        name: p.brand && p.brand !== 'Generic' ? `${p.brand} ${p.name}` : p.name,
        quantity:p.quantity
      })),
      lowStock:lowStock.map(p=>({
        name: p.brand && p.brand !== 'Generic' ? `${p.brand} ${p.name}` : p.name,
        quantity:p.quantity,
        minStockLevel:p.minStockLevel
      })),
      overStock:overStock.map(p=>({
        name: p.brand && p.brand !== 'Generic' ? `${p.brand} ${p.name}` : p.name,
        quantity:p.quantity
      })),
      healthScore
    });

  }catch(err){
    res.status(500).json({message:err.message});
  }

});

/* ──────────────────────────────────────────────────────────
   GET /api/reports/order-placement
   Analytical data for B2B supplier orders
   ────────────────────────────────────────────────────────── */
router.get('/order-placement', async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    // Purge old generic static dummy data if it exists
    await PurchaseOrder.deleteMany({ 
      "items.productName": { 
        $in: [
          "Wireless Keyboard & Mouse Combo", 
          "USB-C Hub Multiport Adapter", 
          "Ergonomic Office Chair", 
          "Smart LED Desk Lamp", 
          "Extended Gaming Mouse Pad"
        ] 
      } 
    });

    let orders = await PurchaseOrder.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('supplier').sort('-createdAt');

    // Auto-seed dummy purchase orders if none exist
    if (orders.length === 0) {
      const suppliers = await Supplier.find();
      const products = await Product.find();
      
      if (suppliers.length > 0) {
        let dummyOrders = [];
        
        if (products.length >= 3) {
          // Dynamically map real products from stock to our B2B purchase orders
          const p1 = products[0];
          const p2 = products[1];
          const p3 = products[2];
          
          dummyOrders = [
            {
              supplier: suppliers[0]._id,
              items: [
                { product: p1._id, productName: p1.name, quantity: 30, price: p1.price },
                { product: p2._id, productName: p2.name, quantity: 50, price: p2.price }
              ],
              totalAmount: (30 * p1.price) + (50 * p2.price),
              status: "sent",
              note: "Urgent standard restocking for Q2 hardware inventory"
            },
            {
              supplier: suppliers[1 % suppliers.length]._id,
              items: [
                { product: p3._id, productName: p3.name, quantity: 15, price: p3.price }
              ],
              totalAmount: 15 * p3.price,
              status: "confirmed",
              note: "Pending delivery by end of next week"
            },
            {
              supplier: suppliers[2 % suppliers.length]._id,
              items: [
                { product: p2._id, productName: p2.name, quantity: 40, price: p2.price },
                { product: p1._id, productName: p1.name, quantity: 20, price: p1.price }
              ],
              totalAmount: (40 * p2.price) + (20 * p1.price),
              status: "received",
              note: "Received and verified in warehouse"
            }
          ];
        } else if (products.length > 0) {
          // If there are some products, but fewer than 3, just repeat them
          const p = products[0];
          dummyOrders = [
            {
              supplier: suppliers[0]._id,
              items: [
                { product: p._id, productName: p.name, quantity: 10, price: p.price }
              ],
              totalAmount: 10 * p.price,
              status: "sent",
              note: "Standard replenishment"
            }
          ];
        } else {
          // Generic fallback if stock is completely empty
          dummyOrders = [
            {
              supplier: suppliers[0]._id,
              items: [
                { productName: "Wireless Keyboard & Mouse Combo", quantity: 30, price: 1200 },
                { productName: "USB-C Hub Multiport Adapter", quantity: 50, price: 850 }
              ],
              totalAmount: 78500,
              status: "sent",
              note: "Urgent standard restocking for Q2 hardware inventory"
            }
          ];
        }
        
        await PurchaseOrder.insertMany(dummyOrders);
        orders = await PurchaseOrder.find({
          createdAt: { $gte: startDate, $lte: endDate }
        }).populate('supplier').sort('-createdAt');
      }
    }

    const totalOrders = orders.length;
    const totalSpend = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Group spend by supplier
    const supplierMap = {};
    orders.forEach(o => {
      const name = o.supplier?.name || "Unknown Supplier";
      if (!supplierMap[name]) supplierMap[name] = 0;
      supplierMap[name] += o.totalAmount;
    });
    const supplierSpendBreakdown = Object.keys(supplierMap).map(name => ({
      name,
      value: supplierMap[name]
    }));

    // Group items count & spend by productName
    const productMap = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        const name = item.productName;
        if (!productMap[name]) {
          productMap[name] = { quantity: 0, spend: 0 };
        }
        productMap[name].quantity += item.quantity;
        productMap[name].spend += item.quantity * item.price;
      });
    });
    const productBreakdown = Object.keys(productMap).map(name => ({
      name,
      quantity: productMap[name].quantity,
      spend: productMap[name].spend
    })).sort((a,b) => b.spend - a.spend);

    res.json({
      orders,
      totalOrders,
      totalSpend,
      supplierSpendBreakdown,
      productBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ──────────────────────────────────────────────────────────
   GET /api/reports/restocking
   Analytical data for stock replenish operations (add transactions)
   ────────────────────────────────────────────────────────── */
router.get('/restocking', async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const refills = await Transaction.find({ 
      type: 'add',
      createdAt: { $gte: startDate, $lte: endDate }
    })
      .sort('-createdAt')
      .populate('product user');

    const totalUnitsReplenished = refills.reduce((sum, r) => sum + r.quantity, 0);
    
    const totalReplenishmentCost = refills.reduce((sum, r) => {
      const price = r.product?.price || 0;
      return sum + (r.quantity * price);
    }, 0);

    // Group by reason
    const reasonMap = {};
    refills.forEach(r => {
      const reason = r.reason || "Manual Restock";
      if (!reasonMap[reason]) reasonMap[reason] = 0;
      reasonMap[reason] += 1;
    });
    const reasonBreakdown = Object.keys(reasonMap).map(name => ({
      name,
      value: reasonMap[name]
    }));

    // Trend grouping by day (last 15 transactions)
    const trendMap = {};
    refills.slice(0, 15).forEach(r => {
      const date = new Date(r.createdAt).toLocaleDateString("en-IN");
      if (!trendMap[date]) trendMap[date] = 0;
      trendMap[date] += r.quantity;
    });
    const trendData = Object.keys(trendMap).map(date => ({
      date,
      quantity: trendMap[date]
    })).reverse();

    res.json({
      refills,
      totalUnitsReplenished,
      totalReplenishmentCost,
      reasonBreakdown,
      trendData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;