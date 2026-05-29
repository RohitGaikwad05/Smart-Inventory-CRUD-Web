import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  ShoppingCart, Search, Plus, Minus, Trash2, Send,
  Package, ChevronDown, CheckCircle, AlertCircle,
  Loader2, ShoppingBag, Tag, X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function PurchaseOrder() {
  const { t } = useLanguage();
  const [products, setProducts]     = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [cart, setCart]             = useState([]);
  const [search, setSearch]         = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [note, setNote]             = useState('');
  const [loading, setLoading]       = useState(false);
  const [status, setStatus]         = useState(null); // { type: 'success'|'error', msg }

  /* ── Fetch products & suppliers ── */
  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/suppliers')
    ]).then(([pRes, sRes]) => {
      setProducts(Array.isArray(pRes.data) ? pRes.data : []);
      setSuppliers(Array.isArray(sRes.data) ? sRes.data : []);
    }).catch(err => {
      console.error("PurchaseOrder fetch error:", err);
    });
  }, []);

  /* ── Filtered products ── */
  const filtered = (products || []).filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  /* ── Add to cart ── */
  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(c => c._id === product._id);
      if (exists) return prev.map(c => c._id === product._id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  /* ── Update qty ── */
  const updateQty = (id, delta) => {
    setCart(prev => prev.map(c =>
      c._id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c
    ));
  };

  /* ── Remove from cart ── */
  const removeFromCart = (id) => setCart(prev => prev.filter(c => c._id !== id));

  /* ── Totals ── */
  const totalItems = cart.reduce((s, c) => s + c.qty, 0);
  const totalAmount = cart.reduce((s, c) => s + c.qty * (c.price || 0), 0);

  /* ── Send order ── */
  const sendOrder = async () => {
    if (!selectedSupplier) return setStatus({ type: 'error', msg: 'Please select a supplier.' });
    if (cart.length === 0) return setStatus({ type: 'error', msg: 'Your order cart is empty.' });

    setLoading(true);
    setStatus(null);
    try {
      const items = cart.map(c => ({
        productId: c._id,
        productName: c.name,
        quantity: c.qty,
        price: c.price || 0
      }));

      const res = await api.post('/purchase-orders/send', {
        supplierId: selectedSupplier,
        items,
        note
      });

      setStatus({ type: 'success', msg: res.data.message });
      setCart([]);
      setNote('');
      setSelectedSupplier('');
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to send order.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200">
            <ShoppingBag size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('purchaseOrder.title')}</h1>
            <p className="text-sm text-gray-500">{t('purchaseOrder.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 items-start">

        {/* ══════════ LEFT: PRODUCT CATALOG ══════════ */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('products.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                <Package size={40} className="mb-3 opacity-40" />
                <p className="text-sm">{t('products.noProducts')}</p>
              </div>
            ) : filtered.map(product => {
              const inCart = cart.find(c => c._id === product._id);
              const isLow = product.quantity <= (product.minStockLevel || 10);
              const isOut = product.quantity === 0;

              return (
                <button
                  key={product._id}
                  onClick={() => addToCart(product)}
                  className={`text-left bg-white rounded-2xl p-4 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]
                    ${inCart ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-100 hover:border-indigo-200'}`}
                >
                  {/* Stock badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-xl bg-indigo-50">
                      <Package size={18} className="text-indigo-500" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isOut ? (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-semibold">
                          {t('dashboard.outOfStock') || 'Out of Stock'}
                        </span>
                      ) : isLow ? (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full font-semibold">
                          {t('dashboard.lowStock') || 'Low Stock'}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-semibold">
                          {t('dashboard.inStock') || 'In Stock'}
                        </span>
                      )}
                      {inCart && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-bold">
                          ×{inCart.qty} in order
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="font-semibold text-gray-800 text-sm mb-1 truncate flex items-center gap-1.5">
                    {product.brand && product.brand !== 'Generic' && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                        {product.brand}
                      </span>
                    )}
                    <span>{product.name}</span>
                  </p>
                  {product.category && (
                    <div className="flex items-center gap-1 mb-2">
                      <Tag size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-400">{product.category}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-base font-bold text-indigo-600">₹{Number(product.price || 0).toLocaleString('en-IN')}</span>
                    <span className="text-xs text-gray-500">{t('products.quantity') || 'Stock'}: {product.quantity}</span>
                  </div>

                  {/* Add button hint */}
                  <div className={`mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition
                    ${inCart
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                    <Plus size={13} />
                    {inCart ? (t('purchaseOrder.added') || 'Added — Click to Add More') : (t('purchaseOrder.addBtn') || 'Add to Order')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════ RIGHT: ORDER PANEL ══════════ */}
        <div className="w-[380px] shrink-0 flex flex-col gap-4 sticky top-6">

          {/* Cart Header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-indigo-600" />
                <h2 className="font-semibold text-gray-800">{t('purchaseOrder.cart') || 'Order Cart'}</h2>
              </div>
              {cart.length > 0 && (
                <span className="text-xs px-2.5 py-1 bg-indigo-600 text-white rounded-full font-bold">
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Cart Items */}
            <div className="max-h-[260px] overflow-y-auto divide-y divide-gray-50">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <ShoppingCart size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">{t('purchaseOrder.emptyCart') || 'No items selected yet'}</p>
                  <p className="text-xs mt-1">{t('purchaseOrder.clickAdd') || 'Click a product on the left to add'}</p>
                </div>
              ) : cart.map(item => (
                <div key={item._id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate flex items-center gap-1.5">
                      {item.brand && item.brand !== 'Generic' && (
                        <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                          {item.brand}
                        </span>
                      )}
                      <span>{item.name}</span>
                    </p>
                    <p className="text-xs text-gray-400">₹{Number(item.price || 0).toLocaleString('en-IN')} each</p>
                  </div>

                  {/* Qty Controls */}
                  <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-1 py-0.5">
                    <button onClick={() => updateQty(item._id, -1)}
                      className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white transition text-gray-600">
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-bold text-gray-800 w-5 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item._id, 1)}
                      className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white transition text-gray-600">
                      <Plus size={12} />
                    </button>
                  </div>

                  <span className="text-sm font-bold text-indigo-700 w-20 text-right">
                    ₹{(item.qty * (item.price || 0)).toLocaleString('en-IN')}
                  </span>

                  <button onClick={() => removeFromCart(item._id)}
                    className="text-gray-300 hover:text-red-400 transition ml-1">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Total */}
            {cart.length > 0 && (
              <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
                <span className="text-indigo-100 text-sm font-medium">{t('invoice.grandTotal') || 'Grand Total'}</span>
                <span className="text-white text-xl font-bold">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* Supplier & Note */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t('invoice.billTo') || 'Select Supplier'} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedSupplier}
                  onChange={e => setSelectedSupplier(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
                >
                  <option value="">-- {t('invoice.selectSupplier') || 'Select Supplier...'} --</option>
                  {suppliers.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.email ? `(${s.email})` : '(no email)'}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {selectedSupplier && !suppliers.find(s => s._id === selectedSupplier)?.email && (
                <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {t('purchaseOrder.noSupplierEmail') || 'This supplier has no email address. Please update their profile first.'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('stock.notes')} <span className="text-gray-400 font-normal">({t('products.optional') || 'optional'})</span></label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={t('purchaseOrder.notePlaceholder') || 'e.g. Please deliver by Friday, handle with care...'}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Status Message */}
          {status && (
            <div className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium border
              ${status.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-red-50 text-red-700 border-red-100'}`}>
              {status.type === 'success'
                ? <CheckCircle size={16} className="shrink-0 mt-0.5" />
                : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
              {status.msg}
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={sendOrder}
            disabled={loading || cart.length === 0}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-sm font-bold text-white
              bg-gradient-to-r from-indigo-600 to-purple-600
              shadow-lg shadow-indigo-200
              hover:from-indigo-700 hover:to-purple-700
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
              transition-all duration-200"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> {t('purchaseOrder.sending') || 'Sending Order Email...'}</>
            ) : (
              <><Send size={17} /> {t('purchaseOrder.createBtn')}</>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            {t('purchaseOrder.noteFooter') || 'A formatted purchase order email will be sent directly to the selected supplier.'}
          </p>
        </div>

      </div>
    </div>
  );
}
