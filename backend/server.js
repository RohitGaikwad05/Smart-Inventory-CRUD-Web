require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const invoiceRoutes = require("./routes/invoice");
const app = express();

// Middleware
app.use(cors()); // Allow all origins for easy deployment
app.use(express.json());

// Health Check / Root Route
app.get('/', (req, res) => {
  res.send('Smart Inventory CRUD with NLP Backend is Running! 🚀');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/nlp', require('./routes/nlp'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/reports', require('./routes/reports'));
app.use("/api/invoices", require("./routes/invoice"));
app.use("/api/suppliers", require("./routes/suppliers"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/purchase-orders", require("./routes/purchaseOrder"));

// Error handler
app.use(errorHandler);

// Add root route for Vercel
app.get('/', (req, res) => {
  res.json({ message: 'VoiceStock API is running!' });
});

// Add debug route
app.get('/debug', (req, res) => {
  res.json({
    message: 'Debug info',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
      GROQ_API_KEY: process.env.GROQ_API_KEY ? 'Set' : 'Not set'
    },
    timestamp: new Date().toISOString()
  });
});

// Connect to database and start server
connectDB().then(async () => {
  try {
    const Product = require('./models/Product');
    const updateResult = await Product.updateMany(
      { minStockLevel: { $ne: 10 } },
      { $set: { minStockLevel: 10 } }
    );
    console.log(`Successfully migrated existing products. Updated ${updateResult.modifiedCount} products to minStockLevel: 10.`);
  } catch (err) {
    console.error("Database migration error:", err);
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});



// Export for Vercel
module.exports = app;

