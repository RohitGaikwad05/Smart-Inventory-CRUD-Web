const express = require('express');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const { getAlerts, dismissAlert } = require('../services/alertService');
const { generateReport } = require('../services/reportService');

const router = express.Router();

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

    res.json({
      totalProducts,
      lowStockCount,
      stockValue: stockValue[0]?.total || 0,
      recentTransactions,
      healthScore
    });



  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/generate', async (req, res) => {
  try {
    const report = await generateReport();
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

    const products = await Product.find();
    const transactions = await Transaction.find();

    const totalValue = products.reduce((s,p)=>s+p.price*p.quantity,0);

    const lowStock = products.filter(p=>p.quantity <= p.minStockLevel);

    const deadStock = products.filter(p=>{
      return !transactions.some(t=>String(t.product) === String(p._id));
    });

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

    const products = await Product.find();
    const last30Days = new Date(Date.now() - 30*24*60*60*1000);
    const transactions = await Transaction.find({ createdAt: { $gte: last30Days } });
    const allTransactions = await Transaction.find();

    const productMovement = {};
    transactions.forEach(t=>{
      const id = String(t.product);
      if(!productMovement[id]) productMovement[id]=0;
      productMovement[id]+=t.quantity;
    });

    const fastMoving = products
      .map(p=>({
        name:p.name,
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
        name:p.name,
        quantity:p.quantity
      })),
      lowStock:lowStock.map(p=>({
        name:p.name,
        quantity:p.quantity,
        minStockLevel:p.minStockLevel
      })),
      overStock:overStock.map(p=>({
        name:p.name,
        quantity:p.quantity
      })),
      healthScore
    });

  }catch(err){
    res.status(500).json({message:err.message});
  }

});


module.exports = router;