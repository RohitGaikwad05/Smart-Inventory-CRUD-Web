import { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { ArrowDownToLine, ArrowUpFromLine, AlertCircle } from "lucide-react";
import { useLanguage } from '../../context/LanguageContext';

export default function StockManagement() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  
  // Add Stock State
  const [addSelectedProduct, setAddSelectedProduct] = useState("");
  const [addQuantity, setAddQuantity] = useState("");
  const [addReason, setAddReason] = useState("");

  // Remove Stock State
  const [removeSelectedProduct, setRemoveSelectedProduct] = useState("");
  const [removeQuantity, setRemoveQuantity] = useState("");
  const [removeReason, setRemoveReason] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll({});
      const data = response.data?.products || response.data;
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  /* ADD STOCK */
  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await productService.addStock({
        productId: addSelectedProduct,
        quantity: Number(addQuantity),
        reason: addReason
      });

      alert(t('stock.successMsg') || "Stock Added & Logged to Ledger");
      
      setAddQuantity("");
      setAddReason("");
      setAddSelectedProduct("");
      fetchProducts();
      window.dispatchEvent(new Event("inventoryUpdated"));
    } catch (error) {
      alert("Error adding stock");
    }
  };

  /* REMOVE STOCK */
  const handleRemoveStock = async (e) => {
    e.preventDefault();
    try {
      await productService.removeStock({
        productId: removeSelectedProduct,
        quantity: Number(removeQuantity),
        reason: removeReason
      });

      alert(t('stock.successMsg') || "Stock Removed & Logged to Ledger");

      setRemoveQuantity("");
      setRemoveReason("");
      setRemoveSelectedProduct("");
      fetchProducts();
      window.dispatchEvent(new Event("inventoryUpdated"));
    } catch (error) {
      alert(error.response?.data?.message || "Error removing stock");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('stock.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('stock.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* STOCK IN (ADD) */}
        <div className="bg-white border border-emerald-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <ArrowDownToLine size={20} />
            </div>
            <div>
              <h2 className="font-bold text-emerald-900">{t('stock.add')}</h2>
              <p className="text-xs text-emerald-700 font-medium">Found stock or direct intake</p>
            </div>
          </div>
          
          <form onSubmit={handleAddStock} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('stock.selectProduct')}</label>
              <select
                value={addSelectedProduct}
                onChange={(e) => setAddSelectedProduct(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
                required
              >
                <option value="">-- {t('stock.chooseProduct')} --</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.brand && p.brand !== "Generic" ? `[${p.brand.toUpperCase()}] ${p.name}` : p.name} (Current: {p.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('stock.quantity')}</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
                  required
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('stock.notes')}</label>
              <input
                type="text"
                placeholder={t('stock.notesPlaceholder')}
                value={addReason}
                onChange={(e) => setAddReason(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition shadow-md shadow-emerald-200 flex justify-center items-center gap-2"
            >
              {t('stock.submitBtn')}
            </button>
          </form>
        </div>

        {/* STOCK OUT (REMOVE) */}
        <div className="bg-white border border-rose-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <ArrowUpFromLine size={20} />
            </div>
            <div>
              <h2 className="font-bold text-rose-900">{t('stock.remove')}</h2>
              <p className="text-xs text-rose-700 font-medium">Damages, shrinkage, or manual disposal</p>
            </div>
          </div>

          <form onSubmit={handleRemoveStock} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('stock.selectProduct')}</label>
              <select
                value={removeSelectedProduct}
                onChange={(e) => setRemoveSelectedProduct(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rose-500 transition"
                required
              >
                <option value="">-- {t('stock.chooseProduct')} --</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.brand && p.brand !== "Generic" ? `[${p.brand.toUpperCase()}] ${p.name}` : p.name} (Current: {p.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('stock.quantity')}</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={removeQuantity}
                  onChange={(e) => setRemoveQuantity(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rose-500 transition"
                  required
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('stock.notes')}</label>
              <input
                type="text"
                placeholder={t('stock.notesPlaceholder')}
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rose-500 transition"
                required
              />
            </div>

            <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex gap-2 text-xs text-orange-800 font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <p>Warning: This action will permanently deduct from your live inventory and cannot be deleted from the audit ledger.</p>
            </div>

            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-3 rounded-xl transition shadow-md shadow-rose-200 flex justify-center items-center gap-2"
            >
              {t('stock.submitBtn')}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}