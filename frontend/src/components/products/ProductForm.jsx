import { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { X, Package } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ProductForm({ product, onClose }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Generic',
    sku: '',
    price: '',
    quantity: '',
    minStockLevel: 10,
    description: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        brand: 'Generic',
        ...product
      });
    }
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (product) {
        await productService.update(product._id, formData);
      } else {
        await productService.create(formData);
      }
      onClose();
    } catch (error) {
      alert(t('products.saveErrorMsg') || 'Error saving product');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Package size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {product ? (t('products.editTitle') || 'Edit Product') : (t('products.addNewTitle') || 'Add New Product')}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.brand') || 'Brand'}</label>
              <input
                type="text"
                placeholder="e.g. Dell"
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.name') || 'Product Name'}</label>
              <input
                type="text"
                placeholder="e.g. XPS 15"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.sku') || 'SKU'} ({t('products.optional') || 'Optional'})</label>
            <input
              type="text"
              placeholder="e.g. LPT-DEL-001"
              value={formData.sku || ''}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.priceLabel') || 'Price (₹)'}</label>
              <input
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.quantity') || 'Quantity'}</label>
              <input
                type="number"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.minStockLabel') || 'Low Stock Alert Level'}</label>
            <input
              type="number"
              placeholder="10"
              value={formData.minStockLevel}
              onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
              className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* ACTIONS */}
          <div className="pt-4 mt-6 border-t border-gray-100 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition"
            >
              {t('products.cancelBtn') || 'Cancel'}
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition shadow-md shadow-indigo-200"
            >
              {product ? (t('products.saveBtn') || 'Save Changes') : (t('products.createBtn') || 'Create Product')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
