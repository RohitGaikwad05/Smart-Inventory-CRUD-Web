import { useState, useEffect } from "react";
import api from "../../services/api";
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Activity,
  Clock,
  RefreshCw,
  X,
  ShoppingCart,
  Truck,
  History,
  Info,
  Calendar
} from "lucide-react";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement
} from "chart.js";

import { Pie, Bar, Line, Doughnut } from "react-chartjs-2";
import { useLanguage } from "../../context/LanguageContext";

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement
);

function KpiCard({ icon: Icon, label, value, iconBg, iconColor, valueColor, sub }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`p-2.5 ${iconBg} ${iconColor} rounded-xl`}>
          <Icon size={18} />
        </div>
      </div>
      <p className={`text-3xl font-bold ${valueColor ?? 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  );
}

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />;
}

export default function Reports() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab]       = useState("health"); // "health" | "orders" | "restocking"
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts]             = useState([]);
  const [analytics, setAnalytics]       = useState(null);
  const [advanced, setAdvanced]         = useState(null);
  const [products, setProducts]         = useState([]);
  const [ordersData, setOrdersData]     = useState(null);
  const [restockData, setRestockData]   = useState(null);
  const [loading, setLoading]           = useState(true);

  const getThirtyDaysAgoString = () => {
    const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  };

  const getTodayString = () => {
    return new Date().toISOString().split("T")[0];
  };

  const [startDate, setStartDate] = useState(getThirtyDaysAgoString());
  const [endDate, setEndDate] = useState(getTodayString());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async (start = startDate, end = endDate) => {
    setLoading(true);
    try {
      const params = { startDate: start, endDate: end };
      const [transRes, alertRes, analyticsRes, advancedRes, productRes, ordersRes, restockRes] =
        await Promise.all([
          api.get("/reports/transactions", { params }),
          api.get("/reports/alerts"),
          api.get("/reports/analytics", { params }),
          api.get("/reports/advanced-analytics", { params }),
          api.get("/products"),
          api.get("/reports/order-placement", { params }),
          api.get("/reports/restocking", { params })
        ]);
      setTransactions(transRes.data);
      setAlerts(alertRes.data);
      setAnalytics(analyticsRes.data);
      setAdvanced(advancedRes.data);
      setProducts(productRes.data);
      setOrdersData(ordersRes.data);
      setRestockData(restockRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (id) => {
    await api.put(`/reports/alerts/${id}/dismiss`);
    fetchData();
  };

  const updateOrderStatus = async (id, newStatus) => {
    try {
      await api.put(`/purchase-orders/${id}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update purchase order status.");
    }
  };

  /* ---- CHART DATA CONFIGS ---- */
  const movementChart = {
    labels: transactions.slice(0, 10).map(tx => new Date(tx.createdAt).toLocaleDateString("en-IN")),
    datasets: [
      {
        label: "Stock Added",
        data: transactions.slice(0, 10).map(tx => tx.type === "add" ? tx.quantity : 0),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.15)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#6366f1"
      },
      {
        label: "Stock Deleted",
        data: transactions.slice(0, 10).map(tx => tx.type === "remove" ? tx.quantity : 0),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#ef4444"
      }
    ]
  };

  const valueChart = {
    labels: products.slice(0, 8).map(p => p.brand && p.brand !== 'Generic' ? `${p.brand} ${p.name}` : p.name),
    datasets: [{
      label: t('reports.inventoryValueByProduct') || "Inventory Value (₹)",
      data: products.slice(0, 8).map(p => p.price * p.quantity),
      backgroundColor: [
        "#6366f1","#8b5cf6","#a78bfa","#818cf8",
        "#4f46e5","#4338ca","#c7d2fe","#ddd6fe"
      ],
      borderRadius: 8,
      barThickness: 28
    }]
  };

  /* B2B Orders charts */
  const supplierSpendChart = ordersData ? {
    labels: ordersData.supplierSpendBreakdown.map(s => s.name),
    datasets: [{
      data: ordersData.supplierSpendBreakdown.map(s => s.value),
      backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
      borderWidth: 0
    }]
  } : null;

  const productOrderChart = ordersData ? {
    labels: ordersData.productBreakdown.slice(0, 5).map(p => p.name),
    datasets: [{
      label: t('reports.totalSpend') || "Total Ordered Value (₹)",
      data: ordersData.productBreakdown.slice(0, 5).map(p => p.spend),
      backgroundColor: "rgba(99, 102, 241, 0.8)",
      borderRadius: 8,
      barThickness: 28
    }]
  } : null;

  /* Restocking charts */
  const restockingTrendChart = restockData ? {
    labels: restockData.trendData.map(tx => tx.date),
    datasets: [{
      label: t('reports.totalReplenished') || "Units Replenished",
      data: restockData.trendData.map(tx => tx.quantity),
      borderColor: "#10b981",
      backgroundColor: "rgba(16, 185, 129, 0.15)",
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: "#10b981"
    }]
  } : null;

  const restockingReasonChart = restockData ? {
    labels: restockData.reasonBreakdown.map(r => r.name),
    datasets: [{
      data: restockData.reasonBreakdown.map(r => r.value),
      backgroundColor: ["#10b981", "#6366f1", "#f59e0b", "#ec4899"],
      borderWidth: 0
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: "#f3f4f6" } } }
  };

  const healthScore = advanced?.healthScore ?? 0;
  const healthColor = healthScore >= 70 ? "#22c55e" : healthScore >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <BarChart2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('reports.title') || 'Reports & Analytics'}</h1>
            <p className="text-gray-500 text-sm">{t('reports.subtitle') || 'Live inventory intelligence and performance metrics'}</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
          <button
            onClick={() => setActiveTab("health")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "health"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-600 hover:text-indigo-600"
            }`}
          >
            📈 {t('reports.generalHealth') || 'General Health'}
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "orders"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-600 hover:text-indigo-600"
            }`}
          >
            📦 {t('reports.orderPlacement') || 'Order Placement'}
          </button>
          <button
            onClick={() => setActiveTab("restocking")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "restocking"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-600 hover:text-indigo-600"
            }`}
          >
            🔄 {t('reports.restocking') || 'Restocking'}
          </button>
        </div>

        <button
          onClick={() => fetchData(startDate, endDate)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition shadow-sm self-start md:self-auto"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> {t('reports.refresh') || 'Refresh'}
        </button>
      </div>

      {/* Date Range Selection Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar size={18} className="text-indigo-500" />
          <span className="font-semibold text-sm">Filter Report Timespan:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl w-full sm:w-auto">
            <span className="text-xs text-gray-400 font-medium uppercase">Start:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                fetchData(e.target.value, endDate);
              }}
              className="bg-transparent border-none text-sm text-gray-700 outline-none cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl w-full sm:w-auto">
            <span className="text-xs text-gray-400 font-medium uppercase">End:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                fetchData(startDate, e.target.value);
              }}
              className="bg-transparent border-none text-sm text-gray-700 outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => fetchData(startDate, endDate)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm w-full sm:w-auto"
          >
            Apply
          </button>
        </div>
      </div>

      {/* 📈 TAB 1: GENERAL HEALTH REPORT */}
      {activeTab === "health" && (
        <>
          {/* KPI CARDS */}
          {loading ? (
            <div className="grid md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : analytics && (
            <div className="grid md:grid-cols-4 gap-6">
              <KpiCard
                icon={Package} label={t('dashboard.totalProducts')}
                value={analytics.totalProducts}
                iconBg="bg-indigo-100" iconColor="text-indigo-600"
                valueColor="text-gray-800"
              />
              <KpiCard
                icon={DollarSign} label={t('dashboard.totalValue')}
                value={`₹${analytics.totalValue.toLocaleString("en-IN")}`}
                iconBg="bg-purple-100" iconColor="text-purple-600"
                valueColor="text-indigo-600"
                sub="Total stock value in INR"
              />
              <KpiCard
                icon={AlertTriangle} label={t('dashboard.lowStockAlerts')}
                value={analytics.lowStock}
                iconBg="bg-orange-100" iconColor="text-orange-500"
                valueColor={analytics.lowStock > 0 ? "text-orange-500" : "text-gray-800"}
                sub="Items at or below minimum level"
              />
              <KpiCard
                icon={TrendingDown} label={t('reports.deadStock') || "Dead Stock"}
                value={analytics.deadStock}
                iconBg="bg-rose-100" iconColor="text-rose-500"
                valueColor={analytics.deadStock > 0 ? "text-rose-500" : "text-gray-800"}
                sub="No movement in 30+ days"
              />
            </div>
          )}

          {/* CHARTS ROW */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={18} className="text-indigo-500" />
                <h3 className="font-semibold text-gray-800">{t('reports.stockMovementTrend') || "Stock Movement Trend"}</h3>
              </div>
              {loading ? <Skeleton className="h-64" /> : (
                <div className="h-64">
                  <Line data={movementChart} options={chartOptions} />
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 mb-4 self-start">
                <Activity size={18} className="text-indigo-500" />
                <h3 className="font-semibold text-gray-800">{t('reports.inventoryHealth') || "Inventory Health"}</h3>
              </div>
              {loading ? <Skeleton className="h-44 w-44 rounded-full" /> : (
                <>
                  <div className="h-44 w-44">
                    <Doughnut
                      data={{
                        labels: ["Healthy", "At Risk"],
                        datasets: [{
                          data: [healthScore, 100 - healthScore],
                          backgroundColor: [healthColor, "#f3f4f6"],
                          borderWidth: 0
                        }]
                      }}
                      options={{ cutout: "78%", plugins: { legend: { display: false } } }}
                    />
                  </div>
                  <div className="text-4xl font-bold mt-2" style={{ color: healthColor }}>
                    {healthScore}<span className="text-xl text-gray-400">/100</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{t('reports.aiHealthScore') || "AI Inventory Health Score"}</p>
                  <div className={`mt-3 text-xs font-semibold px-3 py-1 rounded-full ${
                    healthScore >= 70 ? "bg-green-50 text-green-700" :
                    healthScore >= 40 ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {healthScore >= 70 ? ("✓ " + (t('reports.goodStanding') || "Good Standing")) : healthScore >= 40 ? ("⚠ " + (t('reports.needsAttention') || "Needs Attention")) : ("✗ " + (t('reports.critical') || "Critical"))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 size={18} className="text-indigo-500" />
              <h3 className="font-semibold text-gray-800">{t('reports.inventoryValueByProduct') || "Inventory Value by Product"}</h3>
            </div>
            {loading ? <Skeleton className="h-72" /> : (
              <div className="h-72">
                <Bar data={valueChart} options={{ ...chartOptions, scales: { x: { grid: { display: false } }, y: { grid: { color: "#f8f9fa" } } } }} />
              </div>
            )}
          </div>

          {!loading && advanced && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-emerald-500" />
                  <h3 className="font-semibold text-gray-800">{t('reports.fastMovingProducts') || "Fast Moving Products"}</h3>
                </div>
                <div className="space-y-3">
                  {advanced.fastMoving.length === 0 && (
                    <p className="text-sm text-gray-400">No movement data yet.</p>
                  )}
                  {advanced.fastMoving.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-sm font-medium text-gray-700">{p.name}</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">{p.movement} units moved</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={18} className="text-amber-500" />
                  <h3 className="font-semibold text-gray-800">{t('reports.deadStockItems') || "Dead Stock Items"}</h3>
                </div>
                <div className="space-y-3">
                  {advanced.deadStock.length === 0 && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm">
                      <CheckCircle2 size={16} /> All products are moving. No dead stock!
                    </div>
                  )}
                  {advanced.deadStock.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-sm font-medium text-gray-700">{p.name}</span>
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">{p.quantity} units idle</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE ALERTS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle size={18} className="text-rose-500" />
              <h2 className="font-semibold text-gray-800">{t('reports.activeStockAlerts') || "Active Stock Alerts"}</h2>
              {alerts.length > 0 && (
                <span className="ml-auto text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-full">
                  {alerts.length} active
                </span>
              )}
            </div>
            {loading ? <Skeleton className="h-24" /> :
              alerts.length === 0 ? (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700 text-sm font-medium">
                  <CheckCircle2 size={18} /> All clear — No active alerts at this time.
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div key={alert._id} className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-xl">
                      <div>
                        <p className="font-semibold text-rose-700 text-sm flex items-center gap-1.5">
                          {alert.product?.brand && alert.product.brand !== 'Generic' && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                              {alert.product.brand}
                            </span>
                          )}
                          <span>{alert.product?.name ?? "—"}</span>
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                      </div>
                      <button
                        onClick={() => dismissAlert(alert._id)}
                        className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition"
                      >
                        <X size={12} /> Dismiss
                      </button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* TRANSACTION HISTORY */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Activity size={18} className="text-indigo-500" />
              <h2 className="font-semibold text-gray-800">{t('reports.transactionHistory') || "Transaction History"}</h2>
              <span className="ml-auto text-xs text-gray-400">{transactions.length} records</span>
            </div>
            {loading ? <Skeleton className="h-48" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 rounded-xl">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide rounded-l-xl">{t('reports.dateTime') || 'Date & Time'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('products.name') || 'Product'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('reports.type') || 'Type'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('invoice.qty')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('reports.previous') || 'Previous'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide rounded-r-xl">{t('reports.newStock') || 'New Stock'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.map(tx => (
                      <tr key={tx._id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-gray-500">{new Date(tx.createdAt).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          <div className="flex items-center gap-1.5">
                            {tx.product?.brand && tx.product.brand !== 'Generic' && (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                                {tx.product.brand}
                              </span>
                            )}
                            <span>{tx.product?.name ?? "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            tx.type === "add"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {tx.type === "add" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {tx.type === "add" ? "Stock In" : "Stock Deleted"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{tx.quantity}</td>
                        <td className="px-4 py-3 text-gray-500">{tx.previousQuantity}</td>
                        <td className="px-4 py-3 font-semibold text-indigo-600">{tx.newQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* 📦 TAB 2: ORDER PLACEMENT REPORT */}
      {activeTab === "orders" && (
        <>
          {/* KPI CARDS */}
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : ordersData && (
            <div className="grid md:grid-cols-3 gap-6">
              <KpiCard
                icon={DollarSign} label={t('reports.totalB2BSpend') || "Total B2B Spend"}
                value={`₹${ordersData.totalSpend.toLocaleString("en-IN")}`}
                iconBg="bg-indigo-100" iconColor="text-indigo-600"
                valueColor="text-indigo-600"
                sub="Sum of all purchase orders placed"
              />
              <KpiCard
                icon={ShoppingCart} label={t('reports.totalOrdersPlaced') || "Total Purchase Orders Placed"}
                value={ordersData.totalOrders}
                iconBg="bg-purple-100" iconColor="text-purple-600"
                valueColor="text-gray-800"
                sub="All outbound orders sent to suppliers"
              />
              <KpiCard
                icon={TrendingUp} label={t('reports.avgOrderValue') || "Average Order Value"}
                value={`₹${(ordersData.totalOrders > 0 ? Math.round(ordersData.totalSpend / ordersData.totalOrders) : 0).toLocaleString("en-IN")}`}
                iconBg="bg-emerald-100" iconColor="text-emerald-600"
                valueColor="text-gray-800"
                sub="Mean procurement size"
              />
            </div>
          )}

          {/* CHARTS */}
          {ordersData && (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Supplier Spend Share */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 mb-4 self-start">
                  <Truck size={18} className="text-indigo-500" />
                  <h3 className="font-semibold text-gray-800">{t('reports.spendBySupplier') || "Spend by Supplier"}</h3>
                </div>
                {supplierSpendChart && (
                  <div className="h-56 w-56 flex items-center justify-center">
                    <Pie data={supplierSpendChart} options={{ plugins: { legend: { position: "bottom" } } }} />
                  </div>
                )}
              </div>

              {/* Top Ordered Items */}
              <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart2 size={18} className="text-indigo-500" />
                  <h3 className="font-semibold text-gray-800">{t('reports.topProductsProcured') || "Top 5 Products by Procured Value"}</h3>
                </div>
                {productOrderChart && (
                  <div className="h-64">
                    <Bar data={productOrderChart} options={chartOptions} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HISTORICAL B2B ORDERS LOG */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <History size={18} className="text-indigo-500" />
              <h2 className="font-semibold text-gray-800">{t('reports.purchaseOrdersLog') || "B2B Purchase Orders Log"}</h2>
              {ordersData && (
                <span className="ml-auto text-xs text-gray-400">{ordersData.orders.length} records</span>
              )}
            </div>
            {loading ? <Skeleton className="h-48" /> : ordersData && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 rounded-xl">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide rounded-l-xl">{t('reports.dateTime') || 'Date & Time'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('invoice.billTo') || 'Supplier'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('reports.products') || 'Items'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('reports.status') || 'Status'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide rounded-r-xl">{t('reports.totalSpend') || 'Total Spend'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ordersData.orders.map(order => (
                      <tr key={order._id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-gray-500">{new Date(order.createdAt).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{order.supplier?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {order.items.map((it, idx) => (
                            <div key={idx}>• {it.productName} (x{it.quantity})</div>
                          ))}
                        </td>
                        <td className="px-4 py-3">
                          {order.status === "received" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                              {t('reports.received') || 'Received'}
                            </span>
                          ) : (
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer transition ${
                                order.status === "confirmed"
                                  ? "bg-blue-50 text-blue-700 border-blue-100"
                                  : "bg-amber-50 text-amber-700 border-amber-100"
                              }`}
                            >
                              <option value="sent">{t('reports.sent') || 'Sent'}</option>
                              <option value="confirmed">{t('reports.confirmed') || 'Confirmed'}</option>
                              <option value="received">{t('reports.received') || 'Received'} ✅</option>
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-indigo-600">₹{order.totalAmount.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* 🔄 TAB 3: RESTOCKING REPORT */}
      {activeTab === "restocking" && (
        <>
          {/* KPI CARDS */}
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : restockData && (
            <div className="grid md:grid-cols-3 gap-6">
              <KpiCard
                icon={Package} label={t('reports.totalReplenished') || "Total Units Replenished"}
                value={restockData.totalUnitsReplenished}
                iconBg="bg-emerald-100" iconColor="text-emerald-600"
                valueColor="text-gray-800"
                sub="Sum of all refills added into stock"
              />
              <KpiCard
                icon={DollarSign} label={t('reports.estimatedRestockingCost') || "Estimated Restocking Cost"}
                value={`₹${restockData.totalReplenishmentCost.toLocaleString("en-IN")}`}
                iconBg="bg-indigo-100" iconColor="text-indigo-600"
                valueColor="text-indigo-600"
                sub="Procurement value of replenished items"
              />
              <KpiCard
                icon={Activity} label={t('reports.restockingCount') || "Restocking Count"}
                value={restockData.refills.length}
                iconBg="bg-purple-100" iconColor="text-purple-600"
                valueColor="text-gray-800"
                sub="Total replenishment events"
              />
            </div>
          )}

          {/* CHARTS */}
          {restockData && (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Trend Chart */}
              <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={18} className="text-emerald-500" />
                  <h3 className="font-semibold text-gray-800">{t('reports.replenishmentTrend') || "Replenishment Volume Trend"}</h3>
                </div>
                {restockingTrendChart && (
                  <div className="h-64">
                    <Line data={restockingTrendChart} options={chartOptions} />
                  </div>
                )}
              </div>

              {/* Reasons Breakdown */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 mb-4 self-start">
                  <Info size={18} className="text-emerald-500" />
                  <h3 className="font-semibold text-gray-800">{t('reports.restockTriggers') || "Restock Refill Triggers"}</h3>
                </div>
                {restockingReasonChart && (
                  <div className="h-56 w-56 flex items-center justify-center">
                    <Doughnut data={restockingReasonChart} options={{ plugins: { legend: { position: "bottom" } } }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HISTORICAL RESTOCK LOG */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <History size={18} className="text-indigo-500" />
              <h2 className="font-semibold text-gray-800">{t('reports.replenishmentLog') || "Replenishment History Log"}</h2>
              {restockData && (
                <span className="ml-auto text-xs text-gray-400">{restockData.refills.length} records</span>
              )}
            </div>
            {loading ? <Skeleton className="h-48" /> : restockData && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 rounded-xl">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide rounded-l-xl">{t('reports.dateTime') || 'Date & Time'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('products.name') || 'Product'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('reports.qty') || 'Quantity Added'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('stock.reason') || 'Trigger/Reason'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide rounded-r-xl">{t('reports.user') || 'User'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {restockData.refills.map(refill => (
                      <tr key={refill._id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-gray-500">{new Date(refill.createdAt).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          <div className="flex items-center gap-1.5">
                            {refill.product?.brand && refill.product.brand !== 'Generic' && (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                                {refill.product.brand}
                              </span>
                            )}
                            <span>{refill.product?.name ?? "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600">+{refill.quantity} units</td>
                        <td className="px-4 py-3 text-xs text-gray-600 italic">"{refill.reason || "Manual Stock Refill"}"</td>
                        <td className="px-4 py-3 text-gray-500">{refill.user?.name ?? "system"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}