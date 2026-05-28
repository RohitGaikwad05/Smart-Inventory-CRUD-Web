import { useState, useEffect } from 'react';
import { supplierService } from '../../services/supplierService';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function SupplierList() {
  const { t, language } = useLanguage();
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '', contactNumber: '', email: '', gstin: '' });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getAll();
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = language === 'mr' ? 'हा पुरवठादार हटवायचा?' : (language === 'hi' ? 'क्या आप इस आपूर्तिकर्ता को हटाना चाहते हैं?' : 'Delete this supplier?');
    if (window.confirm(confirmDelete)) {
      try {
        await supplierService.delete(id);
        fetchSuppliers();
      } catch (error) {
        const errorDelete = language === 'mr' ? 'पुरवठादार हटवताना त्रुटी आली' : (language === 'hi' ? 'आपूर्तिकर्ता को हटाने में त्रुटि' : 'Error deleting supplier');
        alert(errorDelete);
      }
    }
  };

  const handleEdit = (supplier) => {
    setEditSupplier(supplier);
    setFormData(supplier);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editSupplier) {
        await supplierService.update(editSupplier._id, formData);
      } else {
        await supplierService.create(formData);
      }
      setShowForm(false);
      setEditSupplier(null);
      setFormData({ name: '', address: '', contactNumber: '', email: '', gstin: '' });
      fetchSuppliers();
    } catch (error) {
      const errorSave = language === 'mr' ? 'पुरवठादार जतन करताना त्रुटी आली' : (language === 'hi' ? 'आपूर्तिकर्ता को सहेजने में त्रुटि' : 'Error saving supplier');
      alert(errorSave);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('suppliers.title')}</h1>
            <p className="text-gray-500 text-sm">{t('suppliers.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditSupplier(null);
            setFormData({ name: '', address: '', contactNumber: '', email: '', gstin: '' });
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl shadow hover:opacity-90 transition"
        >
          <Plus size={16} />
          {t('suppliers.addSupplier')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold mb-4">{editSupplier ? t('suppliers.editTitle') : t('suppliers.addNewTitle')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder={t('suppliers.name')} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border p-2 rounded-lg w-full" required />
              <input type="text" placeholder={t('suppliers.phone')} value={formData.contactNumber} onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} className="border p-2 rounded-lg w-full" required />
              <input type="email" placeholder={t('suppliers.email')} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="border p-2 rounded-lg w-full" />
              <input type="text" placeholder="GSTIN" value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} className="border p-2 rounded-lg w-full" />
              <div className="col-span-2">
                <textarea placeholder={t('suppliers.address')} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="border p-2 rounded-lg w-full" required />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">{t('suppliers.cancelBtn')}</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{t('suppliers.saveBtn')}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-6 py-4">{t('suppliers.name')}</th>
              <th className="text-left px-6 py-4">{t('suppliers.contact')}</th>
              <th className="text-left px-6 py-4">{t('suppliers.address')}</th>
              <th className="text-left px-6 py-4">GSTIN</th>
              <th className="text-right px-6 py-4">{t('suppliers.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(supplier => (
              <tr key={supplier._id} className="border-t hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-800">{supplier.name}</td>
                <td className="px-6 py-4 text-gray-600">
                  {supplier.contactNumber}<br/>
                  <span className="text-xs text-gray-400">{supplier.email}</span>
                </td>
                <td className="px-6 py-4 text-gray-600">{supplier.address}</td>
                <td className="px-6 py-4 text-gray-600">{supplier.gstin || 'N/A'}</td>
                <td className="px-6 py-4 flex justify-end gap-2">
                  <button onClick={() => handleEdit(supplier)} className="p-2 rounded-lg hover:bg-gray-100">
                    <Pencil size={16} className="text-indigo-500" />
                  </button>
                  <button onClick={() => handleDelete(supplier._id)} className="p-2 rounded-lg hover:bg-gray-100">
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
