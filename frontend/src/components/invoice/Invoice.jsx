import { useState, useEffect } from "react";
import api from "../../services/api";
import { supplierService } from "../../services/supplierService";
import { productService } from "../../services/productService";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import company from "../../config/company";
import { Plus, Trash2, FileText } from "lucide-react";

export default function Invoice() {
  const [invoiceType, setInvoiceType] = useState("Sales"); // Sales or Purchase
  const [customer, setCustomer] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [items, setItems] = useState([
    { productId: "", productName: "", quantity: 1, price: 0, total: 0 }
  ]);

  const invoiceNumber = (invoiceType === "Sales" ? "INV-" : "PUR-") + Date.now();

  useEffect(() => {
    supplierService.getAll().then(res => setSuppliers(res.data)).catch(console.error);
    productService.getAll({}).then(res => setProducts(res.data?.products || res.data)).catch(console.error);
  }, []);

  const handleAddItem = () => {
    setItems([...items, { productId: "", productName: "", quantity: 1, price: 0, total: 0 }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    
    if (field === "productId") {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        newItems[index].productId = selectedProduct._id;
        newItems[index].productName = selectedProduct.name;
        newItems[index].price = selectedProduct.price;
      }
    } else {
      newItems[index][field] = value;
    }
    
    // Recalculate total for row
    newItems[index].total = Number(newItems[index].quantity) * Number(newItems[index].price);
    setItems(newItems);
  };

  /* CALCULATION */
  const total = items.reduce((sum, item) => sum + item.total, 0);
  const GST_RATE = 18;
  const gstAmount = (total * GST_RATE) / 100;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const grandTotal = total + gstAmount;

  /* SAVE */
  const saveInvoice = async () => {
    // Validation
    if (items.some(i => !i.productId || i.quantity <= 0)) {
      alert("Please ensure all items are selected and have a valid quantity.");
      return;
    }

    try {
      const payload = {
        invoiceNumber,
        customerName: invoiceType === "Sales" ? customer : undefined,
        supplierName: invoiceType === "Purchase" ? supplierName : undefined,
        items: items.map(i => ({
          productName: i.productName,
          quantity: Number(i.quantity),
          price: Number(i.price),
          total: Number(i.total)
        })),
        totalAmount: grandTotal,
      };

      await api.post("/invoices", payload);
      alert(`${invoiceType} Invoice Saved Successfully`);
      
      // Reset form
      setCustomer("");
      setSupplierName("");
      setItems([{ productId: "", productName: "", quantity: 1, price: 0, total: 0 }]);
      
    } catch (err) {
      alert("Error saving invoice");
    }
  };

  /* PDF */
  const downloadPDF = async () => {
    const element = document.getElementById("invoice");
    const canvas = await html2canvas(element, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = 210;
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, width, height);
    pdf.save(`${invoiceNumber}.pdf`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Point of Sale (Billing)</h1>
            <p className="text-gray-500 text-sm">Create and print sales or purchase invoices dynamically</p>
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-6 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Billing Type</label>
          <select 
            value={invoiceType}
            onChange={e => setInvoiceType(e.target.value)}
            className="border p-2.5 rounded-xl w-48 bg-gray-50 focus:ring-2 focus:ring-indigo-400"
          >
            <option value="Sales">Sales (To Customer)</option>
            <option value="Purchase">Purchase (From Supplier)</option>
          </select>
        </div>

        {invoiceType === "Sales" ? (
          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700">Customer Name</label>
            <input
              type="text"
              placeholder="Walk-in Customer"
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              className="border p-2.5 rounded-xl w-full bg-gray-50 focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700">Supplier Name</label>
            <select 
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              className="border p-2.5 rounded-xl w-full bg-gray-50 focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Select Supplier...</option>
              {suppliers.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* ITEMS EDITOR */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-4">Bill Items</h3>
        
        {items.map((item, index) => (
          <div key={index} className="flex gap-4 items-center flex-wrap sm:flex-nowrap">
            <div className="flex-1">
              <select 
                value={item.productId}
                onChange={e => handleItemChange(index, "productId", e.target.value)}
                className="w-full border p-2.5 rounded-xl bg-gray-50"
              >
                <option value="">Select Product...</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.quantity})</option>)}
              </select>
            </div>
            
            <div className="w-24">
              <input 
                type="number" 
                min="1"
                placeholder="Qty" 
                value={item.quantity}
                onChange={e => handleItemChange(index, "quantity", e.target.value)}
                className="w-full border p-2.5 rounded-xl bg-gray-50 text-center"
              />
            </div>

            <div className="w-32">
              <input 
                type="number" 
                placeholder="Price" 
                value={item.price}
                onChange={e => handleItemChange(index, "price", e.target.value)}
                className="w-full border p-2.5 rounded-xl bg-gray-50 text-right"
              />
            </div>

            <div className="w-32 text-right font-medium text-gray-700">
              ₹ {item.total.toLocaleString("en-IN")}
            </div>

            <button 
              onClick={() => handleRemoveItem(index)}
              className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition"
              disabled={items.length === 1}
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}

        <button 
          onClick={handleAddItem}
          className="flex items-center gap-2 text-indigo-600 font-medium px-4 py-2 hover:bg-indigo-50 rounded-xl transition mt-2"
        >
          <Plus size={16} /> Add Another Item
        </button>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-4 justify-end">
        <button onClick={downloadPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition shadow-sm">
          Download PDF
        </button>
        <button onClick={saveInvoice} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition shadow-sm">
          Save {invoiceType} Invoice
        </button>
      </div>

      {/* INVOICE PREVIEW */}
      <div className="mt-8">
        <p className="text-gray-400 text-sm mb-4 text-center">Invoice Preview</p>
        <div id="invoice" className="bg-white p-12 rounded-none shadow-xl border border-gray-200 text-gray-800 relative mx-auto max-w-[800px]">
          {/* HEADER */}
          <div className="flex justify-between border-b-2 border-indigo-600 pb-8">
            <div className="flex gap-4">
              <img src={company.logo} className="h-16" alt="Logo" />
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{company.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{company.tagline}</p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {company.address}<br/>
                  GSTIN: {company.gstin}
                </p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-2xl font-bold text-indigo-600 tracking-wider">TAX INVOICE</h3>
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p><b className="text-gray-800">Invoice No:</b> {invoiceNumber}</p>
                <p><b className="text-gray-800">Date:</b> {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* CUSTOMER / SUPPLIER */}
          <div className="mt-8 flex justify-between bg-gray-50 p-6 rounded-lg">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-2">Billed To:</p>
              <h3 className="text-xl font-semibold text-gray-800">
                {invoiceType === "Sales" ? (customer || "Walk-in Customer") : (supplierName || "Unknown Supplier")}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-2">Invoice Type:</p>
              <h3 className="text-xl font-semibold text-indigo-600">{invoiceType}</h3>
            </div>
          </div>

          {/* TABLE */}
          <table className="w-full mt-10 text-sm">
            <thead>
              <tr className="bg-indigo-600 text-white">
                <th className="p-3 text-left font-medium rounded-tl-lg">#</th>
                <th className="p-3 text-left font-medium">Product Description</th>
                <th className="p-3 text-center font-medium">Qty</th>
                <th className="p-3 text-right font-medium">Unit Price</th>
                <th className="p-3 text-right font-medium rounded-tr-lg">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="p-4 text-gray-500">{i + 1}</td>
                  <td className="p-4 font-medium text-gray-800">{item.productName || "-"}</td>
                  <td className="p-4 text-center">{item.quantity}</td>
                  <td className="p-4 text-right">₹{Number(item.price).toLocaleString("en-IN")}</td>
                  <td className="p-4 text-right font-semibold text-gray-900">₹{item.total.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTAL */}
          <div className="flex justify-end mt-10">
            <div className="w-80 space-y-3 bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">₹{total.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>CGST (9%)</span>
                <span className="font-medium text-gray-900">₹{cgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (9%)</span>
                <span className="font-medium text-gray-900">₹{sgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 text-xl font-bold text-gray-900">
                <span>Grand Total</span>
                <span className="text-indigo-600">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-16 border-t border-gray-200 pt-8 text-xs text-gray-500 flex justify-between">
            <div>
              <p className="font-semibold text-gray-700 mb-1">Terms & Conditions</p>
              <p>1. Goods once sold will not be taken back.</p>
              <p>2. Subject to local jurisdiction.</p>
            </div>
            <div className="text-right">
              <p>For <b className="text-gray-700">{company.name}</b></p>
              <div className="mt-12 border-t border-gray-300 pt-2 inline-block">
                <p>Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT FIX */}
      <style>{`
      @media print {
        @page { size: A4; margin: 0; }
        body * { visibility: hidden; }
        #invoice, #invoice * { visibility: visible; }
        #invoice { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; padding: 20mm; }
        button, input, select { display: none !important; }
      }
      `}</style>
    </div>
  );
}