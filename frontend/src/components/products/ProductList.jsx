import { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import ProductForm from './ProductForm';

import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";

export default function ProductList() {

  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [search, setSearch] = useState('');

  /* fetch products when search changes */

  useEffect(() => {
    fetchProducts();
  }, [search]);


  /* listen for inventory updates from chat */

  useEffect(() => {

    const handler = () => {
      fetchProducts();
    };

    window.addEventListener("inventoryUpdated", handler);

    return () => {
      window.removeEventListener("inventoryUpdated", handler);
    };

  }, []);


  const fetchProducts = async () => {

    try {

      const response = await productService.getAll({ search });

      /* support both API response formats */

      const data = response.data?.products || response.data;

      setProducts(data);

    } catch (error) {

      console.error('Error fetching products:', error);

    }

  };




  const handleEdit = (product) => {

    setEditProduct(product);

    setShowForm(true);

  };


  const handleFormClose = () => {

    setShowForm(false);

    setEditProduct(null);

    fetchProducts();

  };


  return (

    <div className="space-y-8 max-w-7xl mx-auto">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Product Inventory</h1>
            <p className="text-gray-500 text-sm">Manage your catalog, SKUs, and stock limits</p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl shadow hover:opacity-90 transition"
        >
          <Plus size={16} />
          Add Product
        </button>

      </div>


      {/* SEARCH */}

      <div className="relative max-w-md">

        <Search
          size={16}
          className="absolute left-3 top-3 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

      </div>


      {/* FORM */}

      {showForm && (
        <ProductForm product={editProduct} onClose={handleFormClose} />
      )}


      {/* PRODUCT TABLE */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-600">

            <tr>

              <th className="text-left px-6 py-4">Name & SKU</th>

              <th className="text-left px-6 py-4">Unit Price</th>

              <th className="text-left px-6 py-4">Status</th>

              <th className="text-left px-6 py-4">Quantity</th>

              <th className="text-left px-6 py-4">Total Value</th>

              <th className="text-right px-6 py-4">Actions</th>

            </tr>

          </thead>

          <tbody>

            {products.map(product => {

              const lowStock =
                product.quantity <= (product.minStockLevel || 10);

              const totalValue = product.price * product.quantity;

              return (

                <tr
                  key={product._id}
                  className="border-t hover:bg-gray-50 transition"
                >

                  {/* NAME & SKU */}

                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    {product.sku && <p className="text-xs text-gray-400 font-mono mt-1">SKU: {product.sku}</p>}
                  </td>

                  {/* UNIT PRICE */}

                  <td className="px-6 py-4 text-gray-600 font-medium">
                    ₹{product.price.toLocaleString("en-IN")}
                  </td>

                  {/* STATUS */}
                  
                  <td className="px-6 py-4">
                    {product.quantity === 0 ? (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-600 border border-red-100">Out of Stock</span>
                    ) : lowStock ? (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-600 border border-amber-100">Low Stock</span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">In Stock</span>
                    )}
                  </td>

                  {/* QUANTITY */}

                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-800">{product.quantity}</span>
                    <span className="text-xs text-gray-400 ml-1">/ Min: {product.minStockLevel || 10}</span>
                  </td>


                  {/* TOTAL VALUE */}

                  <td className="px-6 py-4 font-medium text-indigo-600">
                    ₹{totalValue.toLocaleString("en-IN")}
                  </td>


                  {/* ACTIONS */}

                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-indigo-500 font-medium"
                    >
                      <Pencil size={16} /> Edit
                    </button>
                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

    </div>

  );

}