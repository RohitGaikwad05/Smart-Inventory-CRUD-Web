import { useEffect, useState } from "react";
import api from "../../services/api";
import { supplierService } from "../../services/supplierService";
import { Search, FileText } from "lucide-react";

export default function InvoiceList() {
  const [list, setList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");

  useEffect(() => {
    supplierService.getAll().then(res => setSuppliers(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [selectedSupplier]);

  const fetchInvoices = () => {
    let url = "/invoices";
    if (selectedSupplier) {
      url += `?supplierName=${encodeURIComponent(selectedSupplier)}`;
    }
    api.get(url).then(res => setList(res.data)).catch(console.error);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-100 text-cyan-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Invoice History</h1>
            <p className="text-gray-500 text-sm">View and filter past sales and purchase invoices</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 max-w-xl">
        <div className="relative flex-1">
          <select 
            value={selectedSupplier}
            onChange={e => setSelectedSupplier(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">All Suppliers</option>
            {suppliers.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-6 py-4">Invoice Number</th>
              <th className="text-left px-6 py-4">Customer</th>
              <th className="text-left px-6 py-4">Supplier</th>
              <th className="text-left px-6 py-4">Date</th>
              <th className="text-right px-6 py-4">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {list.map(i => (
              <tr key={i._id} className="border-t hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-indigo-600">{i.invoiceNumber}</td>
                <td className="px-6 py-4 text-gray-800">{i.customerName || "Walk-in Customer"}</td>
                <td className="px-6 py-4 text-gray-600">
                  {i.supplierName ? (
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-100">
                      {i.supplierName}
                    </span>
                  ) : "-"}
                </td>
                <td className="px-6 py-4 text-gray-500">{new Date(i.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900">₹{i.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}