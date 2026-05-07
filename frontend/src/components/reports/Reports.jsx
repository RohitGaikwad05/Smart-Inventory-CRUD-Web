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
  X
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

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement
);

function KpiCard({ icon: Icon, label, value, iconBg, iconColor, valueColor, sub }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
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
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts]             = useState([]);
  const [analytics, setAnalytics]       = useState(null);
  const [advanced, setAdvanced]         = useState(null);
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transRes, alertRes, analyticsRes, advancedRes, productRes] =
        await Promise.all([
          api.get("/reports/transactions"),
          api.get("/reports/alerts"),
          api.get("/reports/analytics"),
          api.get("/reports/advanced-analytics"),
          api.get("/products")
        ]);
      setTransactions(transRes.data);
      setAlerts(alertRes.data);
      setAnalytics(analyticsRes.data);
      setAdvanced(advancedRes.data);
      setProducts(productRes.data);
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

  /* ---- CHART DATA ---- */
  const topProducts = products.slice(0, 6);

  const movementChart = {
    labels: transactions.slice(0, 10).map(t => new Date(t.createdAt).toLocaleDateString("en-IN")),
    datasets: [
      {
        label: "Stock Added",
        data: transactions.slice(0, 10).map(t => t.type === "add" ? t.quantity : 0),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.15)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#6366f1"
      },
      {
        label: "Stock Removed",
        data: transactions.slice(0, 10).map(t => t.type === "remove" ? t.quantity : 0),
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
    labels: products.slice(0, 8).map(p => p.name),
    datasets: [{
      label: "Inventory Value (₹)",
      data: products.slice(0, 8).map(p => p.price * p.quantity),
      backgroundColor: [
        "#6366f1","#8b5cf6","#a78bfa","#818cf8",
        "#4f46e5","#4338ca","#c7d2fe","#ddd6fe"
      ],
      borderRadius: 8,
      barThickness: 28
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: "#f3f4f6" } } }
  };

  const healthScore = advanced?.healthScore ?? 0;
  const healthColor = healthScore >= 70 ? "#22c55e" : healthScore >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <BarChart2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
            <p className="text-gray-500 text-sm">Live inventory intelligence and performance metrics</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition shadow-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* KPI CARDS */}
      {loading ? (
        <div className="grid md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : analytics && (
        <div className="grid md:grid-cols-4 gap-6">
          <KpiCard
            icon={Package} label="Total Products"
            value={analytics.totalProducts}
            iconBg="bg-indigo-100" iconColor="text-indigo-600"
            valueColor="text-gray-800"
          />
          <KpiCard
            icon={DollarSign} label="Inventory Value"
            value={`₹${analytics.totalValue.toLocaleString("en-IN")}`}
            iconBg="bg-purple-100" iconColor="text-purple-600"
            valueColor="text-indigo-600"
            sub="Total stock value in INR"
          />
          <KpiCard
            icon={AlertTriangle} label="Low Stock Items"
            value={analytics.lowStock}
            iconBg="bg-orange-100" iconColor="text-orange-500"
            valueColor={analytics.lowStock > 0 ? "text-orange-500" : "text-gray-800"}
            sub="Items at or below minimum level"
          />
          <KpiCard
            icon={TrendingDown} label="Dead Stock"
            value={analytics.deadStock}
            iconBg="bg-rose-100" iconColor="text-rose-500"
            valueColor={analytics.deadStock > 0 ? "text-rose-500" : "text-gray-800"}
            sub="No movement in 30+ days"
          />
        </div>
      )}

      {/* CHARTS ROW */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Stock Movement Line Chart */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-indigo-500" />
            <h3 className="font-semibold text-gray-800">Stock Movement Trend</h3>
          </div>
          {loading ? <Skeleton className="h-64" /> : (
            <div className="h-64">
              <Line data={movementChart} options={chartOptions} />
            </div>
          )}
        </div>

        {/* Health Doughnut */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-4 self-start">
            <Activity size={18} className="text-indigo-500" />
            <h3 className="font-semibold text-gray-800">Inventory Health</h3>
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
              <p className="text-sm text-gray-500 mt-1">AI Inventory Health Score</p>
              <div className={`mt-3 text-xs font-semibold px-3 py-1 rounded-full ${
                healthScore >= 70 ? "bg-green-50 text-green-700" :
                healthScore >= 40 ? "bg-amber-50 text-amber-700" :
                "bg-red-50 text-red-700"
              }`}>
                {healthScore >= 70 ? "✓ Good Standing" : healthScore >= 40 ? "⚠ Needs Attention" : "✗ Critical"}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 size={18} className="text-indigo-500" />
          <h3 className="font-semibold text-gray-800">Inventory Value by Product</h3>
        </div>
        {loading ? <Skeleton className="h-72" /> : (
          <div className="h-72">
            <Bar data={valueChart} options={{ ...chartOptions, scales: { x: { grid: { display: false } }, y: { grid: { color: "#f8f9fa" } } } }} />
          </div>
        )}
      </div>

      {/* Fast Moving + Dead Stock */}
      {!loading && advanced && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-emerald-500" />
              <h3 className="font-semibold text-gray-800">Fast Moving Products</h3>
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
              <h3 className="font-semibold text-gray-800">Dead Stock Items</h3>
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

      {/* ALERTS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle size={18} className="text-rose-500" />
          <h2 className="font-semibold text-gray-800">Active Stock Alerts</h2>
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
                    <p className="font-semibold text-rose-700 text-sm">{alert.product?.name}</p>
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

      {/* TRANSACTION TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity size={18} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-800">Transaction History</h2>
          <span className="ml-auto text-xs text-gray-400">{transactions.length} records</span>
        </div>
        {loading ? <Skeleton className="h-48" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 rounded-xl">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide rounded-l-xl">Date & Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Previous</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide rounded-r-xl">New Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500">{new Date(t.createdAt).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{t.product?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        t.type === "add"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}>
                        {t.type === "add" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {t.type === "add" ? "Added" : "Removed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{t.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{t.previousQuantity}</td>
                    <td className="px-4 py-3 font-semibold text-indigo-600">{t.newQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}