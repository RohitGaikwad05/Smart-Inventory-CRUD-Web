const Product = require('../models/Product');
const { checkAndCreateAlert } = require('../services/alertService');

exports.createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    
    // Auto-generate SKU if not provided
    if (!productData.sku) {
      const prefix = productData.name ? productData.name.substring(0, 3).toUpperCase() : 'PRD';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      productData.sku = `${prefix}-${randomNum}`;
    }

    const product = await Product.create(productData);
    await checkAndCreateAlert(product);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    
    const products = await Product.find(query).populate('category');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await checkAndCreateAlert(product);
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
