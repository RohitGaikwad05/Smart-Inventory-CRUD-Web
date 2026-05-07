import { useState, useEffect } from 'react';
import api from '../../services/api';
import { ArrowUpRight, ArrowDownRight, History } from 'lucide-react';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading transaction history...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <History size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Stock Ledger</h1>
          <p className="text-gray-500 text-sm">Comprehensive audit trail of all inventory movements</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">Date & Time</th>
              <th className="px-6 py-4 font-medium">Product</th>
              <th className="px-6 py-4 font-medium">Action Type</th>
              <th className="px-6 py-4 font-medium text-right">Quantity Change</th>
              <th className="px-6 py-4 font-medium text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                  {new Date(tx.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {tx.product?.name || 'Unknown Product'}
                </td>
                <td className="px-6 py-4">
                  {tx.type === 'add' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      <ArrowUpRight size={14} /> Stock Added
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                      <ArrowDownRight size={14} /> Stock Removed
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  <span className={tx.type === 'add' ? 'text-emerald-600' : 'text-rose-600'}>
                    {tx.type === 'add' ? '+' : '-'}{tx.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-gray-600 font-medium">
                  {tx.newQuantity}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  No stock transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
