require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const products = await Product.find({ $or: [{ sku: { $exists: false } }, { sku: '' }, { sku: null }] });
    console.log(`Found ${products.length} products without SKU.`);

    let updated = 0;
    for (const product of products) {
      const prefix = product.name ? product.name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, 'X') : 'PRD';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      product.sku = `${prefix}-${randomNum}`;
      await product.save();
      console.log(`Updated ${product.name} -> ${product.sku}`);
      updated++;
    }

    console.log(`Successfully generated SKUs for ${updated} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
