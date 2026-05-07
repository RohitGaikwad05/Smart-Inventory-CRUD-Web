import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import Layout from "./components/layout/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import ProductList from "./components/products/ProductList";
import StockManagement from "./components/stock/StockManagement";
import TransactionHistory from "./components/stock/TransactionHistory";
import VoiceInput from "./components/voice/VoiceInput";
import ChatInterface from "./components/voice/ChatInterface";
import Reports from "./components/reports/Reports";
import ReportGenerator from "./components/reports/ReportGenerator";
import Invoice from "./components/invoice/Invoice";
import InvoiceList from "./components/invoice/InvoiceList";

import Splash from "./components/auth/Splash";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";

import Profile from "./components/profile/Profile";
import SupplierList from "./components/suppliers/SupplierList";

// A wrapper to handle authenticated routes
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa]">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/splash" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
        <Route path="/stock" element={<ProtectedRoute><StockManagement /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute><SupplierList /></ProtectedRoute>} />
        <Route path="/voice" element={<ProtectedRoute><VoiceInput /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatInterface /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/report-generator" element={<ProtectedRoute><ReportGenerator /></ProtectedRoute>} />
        <Route path="/invoice" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;