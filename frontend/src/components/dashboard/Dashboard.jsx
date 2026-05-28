import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import {
  Package,
  TrendingUp,
  Activity,
  ArrowUp,
  ArrowDown,
  Mic,
  FileText,
  History,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const dashboard = await api.get("/reports/dashboard");
      const productRes = await api.get("/products");
      setStats(dashboard.data);
      setProducts(productRes.data?.products || productRes.data);
    } catch (err) {
      console.error(err);
    }
    if (loading) {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-gray-500 flex justify-center items-center h-full">{t('dashboard.loading')}</div>;
  }

  /* ---------------------------
  AI INSIGHT ENGINE & DATA PREP
  ----------------------------*/
  const fastMoving = [...products]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map(p => ({ name: p.name, stock: p.quantity }));

  const deadStock = products.filter(p => p.quantity === 0);
  const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= (p.minStockLevel || 10));

  const healthScore = stats?.healthScore ?? 0;


  const alerts = [];
  if (lowStock.length > 0) alerts.push(`${lowStock.length} items are running low on stock.`);
  if (deadStock.length > 0) alerts.push(`${deadStock.length} items are completely out of stock!`);

  /* ---------------------------
  TIME FORMATTER
  ----------------------------*/
  function timeAgo(date) {
    if (!date) return "just now";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} day(s) ago`;
  }

  const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('dashboard.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 font-medium">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          {t('dashboard.live')}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => navigate('/voice')} className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-300 hover:shadow-md transition group">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Mic size={24} />
          </div>
          <span className="text-sm font-medium text-gray-700">{t('dashboard.voiceAi')}</span>
        </button>
        <button onClick={() => navigate('/invoice')} className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-purple-300 hover:shadow-md transition group">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <span className="text-sm font-medium text-gray-700">{t('dashboard.createInvoice')}</span>
        </button>
        <button onClick={() => navigate('/transactions')} className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition group">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <History size={24} />
          </div>
          <span className="text-sm font-medium text-gray-700">{t('dashboard.stockLedger')}</span>
        </button>
        <button onClick={() => navigate('/products')} className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-300 hover:shadow-md transition group">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Package size={24} />
          </div>
          <span className="text-sm font-medium text-gray-700">{t('dashboard.manageProducts')}</span>
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Package size={80} />
          </div>
          <p className="text-sm opacity-80 font-medium">{t('dashboard.totalProducts')}</p>
          <h2 className="text-4xl font-bold mt-2">{stats?.totalProducts || 0}</h2>
          <div className="mt-4 text-xs bg-white/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
            Across all categories
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('dashboard.inventoryValue')}</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-2">
                ₹{(stats?.stockValue || 0).toLocaleString("en-IN")}
              </h2>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('dashboard.lowOutStock')}</p>
              <h2 className="text-3xl font-bold text-rose-500 mt-2">
                {lowStock.length + deadStock.length}
              </h2>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW - CHARTS & HEALTH */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* CHART */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
          <h3 className="font-semibold text-gray-800 mb-6">{t('dashboard.topStocked')}</h3>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fastMoving} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="stock" radius={[6, 6, 0, 0]}>
                  {fastMoving.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HEALTH & ALERTS */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">{t('dashboard.healthScore')}</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold border border-indigo-100">AI</span>
            </div>
            <div className="text-5xl font-extrabold text-indigo-600 mb-4 tracking-tight">
              {healthScore}
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                style={{ width: `${healthScore}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3 font-medium">{t('dashboard.healthCalculated')}</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">{t('dashboard.criticalAlerts')}</h3>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-xl text-sm font-medium border border-emerald-100">
                  <Activity size={16} /> {t('dashboard.healthyMsg')}
                </div>
              ) : (
                alerts.map((alert, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-rose-700 bg-rose-50 p-3 rounded-xl font-medium border border-rose-100">
                    <AlertCircle size={16} /> {alert}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ALERTS & INTELLIGENCE GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" /> {t('dashboard.lowStockAlerts')}
            </h3>
            <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full font-semibold border border-amber-100">
              {t('dashboard.needsRestock')}
            </span>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px] pr-2">
            {!stats?.lowStockProducts || stats.lowStockProducts.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">No low stock items detected.</p>
            ) : (
              stats.lowStockProducts.map(prod => (
                <div key={prod._id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 hover:border-gray-200 transition">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      {prod.brand && prod.brand !== 'Generic' && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                          {prod.brand}
                        </span>
                      )}
                      <span>{prod.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{t('dashboard.minStock')}: {prod.minStockLevel || 10}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500">
                      {t('dashboard.qty')}: <span className={prod.quantity === 0 ? "text-red-500 font-bold" : "text-amber-600 font-bold"}>{prod.quantity}</span>
                    </span>
                    <button 
                      onClick={() => navigate('/stock')} 
                      className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-xs font-medium hover:opacity-90 transition"
                    >
                      {t('dashboard.restockBtn')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* High Demand Alerts */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-500" /> {t('dashboard.highDemand')}
            </h3>
            <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full font-semibold border border-indigo-100">
              {t('dashboard.topSellers')}
            </span>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px] pr-2">
            {!stats?.highDemandProducts || stats.highDemandProducts.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">No high demand products recorded in the last 30 days.</p>
            ) : (
              stats.highDemandProducts.map(prod => (
                <div key={prod._id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 hover:border-gray-200 transition">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      {prod.brand && prod.brand !== 'Generic' && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                          {prod.brand}
                        </span>
                      )}
                      <span>{prod.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Current Stock: {prod.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-bold">
                      {prod.totalDemanded} {t('dashboard.sold')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800">{t('dashboard.recentTransactions')}</h3>
          <button onClick={() => navigate('/transactions')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            {t('dashboard.viewLedger')} &rarr;
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats?.recentTransactions?.slice(0, 6).map((item, i) => {
            const type = item.type === "remove" ? "remove" : "add";
            const productName = item.product?.name || item.productName || "Unknown";
            const brand = item.product?.brand || item.brand;
            
            return (
              <motion.div
                key={item._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between bg-gray-50 px-5 py-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${
                    type === "add" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                  }`}>
                    {type === "add" ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 truncate max-w-[150px] flex items-center gap-1.5">
                      {brand && brand !== 'Generic' && (
                        <span className="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                          {brand}
                        </span>
                      )}
                      <span>{productName}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{timeAgo(item.createdAt)}</p>
                  </div>
                </div>
                <div className={`text-sm font-bold ${type === "add" ? "text-emerald-600" : "text-rose-600"}`}>
                  {type === "add" ? "+" : "-"}{item.quantity}
                </div>
              </motion.div>
            )
          })}
          {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
            <p className="text-gray-500 text-sm col-span-full">{t('dashboard.noActivity')}</p>
          )}
        </div>
      </div>
      
    </div>
  );
}