const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, default: 'Generic', trim: true },
  sku: { type: String, unique: true, sparse: true },
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  price: { type: Number, required: true, min: [0.01, 'Price must be greater than zero'] },
  quantity: { type: Number, required: true, default: 0, min: 0 },
  minStockLevel: { type: Number, default: 10},
  unit: { type: String, default: 'pcs' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

productSchema.index({ name: 'text', brand: 'text', description: 'text' });
productSchema.index({ name: 1, brand: 1 });

module.exports = mongoose.model('Product', productSchema);
