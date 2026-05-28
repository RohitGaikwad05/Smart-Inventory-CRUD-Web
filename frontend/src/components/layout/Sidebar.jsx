import {
  LayoutDashboard,
  Package,
  Boxes,
  Mic,
  MessageCircle,
  BarChart3,
  FileText,
  Sparkles,
  Users,
  User,
  LogOut,
  History,
  ShoppingBag,
  Settings as SettingsIcon
} from "lucide-react";

import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", key: "sidebar.dashboard", path: "/dashboard" },
  { icon: Package, label: "Products", key: "sidebar.products", path: "/products" },
  { icon: Boxes, label: "Stock", key: "sidebar.stock", path: "/stock" },
  { icon: History, label: "Stock Ledger", key: "sidebar.ledger", path: "/transactions" },
  { icon: Users, label: "Suppliers", key: "sidebar.suppliers", path: "/suppliers" },
  { icon: Mic, label: "Voice", key: "sidebar.voice", path: "/voice" },
  { icon: MessageCircle, label: "Chat", key: "sidebar.chat", path: "/chat" },
  { icon: Sparkles, label: "AI Report", key: "sidebar.aiReport", path: "/report-generator" },
  { icon: BarChart3, label: "Reports", key: "sidebar.reports", path: "/reports" },
  { icon: FileText, label: "Create Invoice", key: "sidebar.createInvoice", path: "/invoice" },
  { icon: FileText, label: "All Invoices", key: "sidebar.allInvoices", path: "/invoices" },
  { icon: ShoppingBag, label: "Purchase Order", key: "sidebar.purchaseOrder", path: "/purchase-order" },
];

export default function Sidebar() {
  const { t } = useLanguage();
  const location = useLocation();
  const itemRefs = useRef([]);
  const [highlightStyle, setHighlightStyle] = useState({});

  /* 🔥 MOVE FLOATING HIGHLIGHT */

  useEffect(() => {
    const activeIndex = navItems.findIndex(
      item => location.pathname === item.path
    );

    const el = itemRefs.current[activeIndex];

    if (el) {
      setHighlightStyle({
        top: el.offsetTop,
        height: el.offsetHeight
      });
    }
  }, [location.pathname]);

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col p-6">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">

        <img
          src="/logo.png"
          alt="Smart Inventory Crud Web Application With NLP Logo"
          className="h-20 w-20 object-contain 
                     drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]"
        />

        <div>
          <p className="text-sm font-bold leading-snug
            bg-gradient-to-r from-indigo-500 to-purple-600
            bg-clip-text text-transparent">
            Smart Inventory Crud Web Application With NLP
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex flex-col gap-2 flex-1 overflow-y-auto pr-1 mb-6">

        {/* 🔥 FLOATING ACTIVE BACKGROUND */}
        <div
          className="absolute left-0 w-full rounded-xl 
                     bg-gradient-to-r from-indigo-500 to-purple-600
                     shadow-[0_8px_25px_rgba(102,126,234,0.4)]
                     transition-all duration-300 ease-in-out"
          style={{
            ...highlightStyle,
          }}
        />

        {/* Glow layer */}
        <div
          className="absolute left-0 w-full rounded-xl blur-md
                     bg-gradient-to-r from-indigo-500 to-purple-600
                     opacity-40 transition-all duration-300"
          style={{
            ...highlightStyle,
          }}
        />

        {navItems.map((item, index) => {

          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              ref={(el) => (itemRefs.current[index] = el)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                          transition-all duration-300

                ${isActive
                  ? "text-white scale-[1.03]"
                  : "text-gray-500 hover:bg-gray-100 hover:scale-[1.02]"}`}
            >

              {/* 🔥 CURVED SIDE GLOW */}
              {isActive && (
                <span className="absolute right-[-20px] top-1/2 -translate-y-1/2 
                  w-10 h-10 bg-purple-400 blur-xl rounded-full opacity-70" />
              )}

              {/* Content */}
              <div className="relative z-10 flex items-center gap-3">
                <Icon size={18} />
                {t(item.key) || item.label}
              </div>

            </NavLink>
          );
        })}

      </nav>

      {/* Footer Profile, Settings & Logout */}
      <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-1">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              isActive ? "bg-indigo-50 text-indigo-600 font-bold" : "text-gray-500 hover:bg-gray-50"
            }`
          }
        >
          <User size={18} />
          {t('sidebar.profile') || 'Profile'}
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              isActive ? "bg-indigo-50 text-indigo-600 font-bold" : "text-gray-500 hover:bg-gray-50"
            }`
          }
        >
          <SettingsIcon size={18} />
          {t('sidebar.settings') || 'Settings'}
        </NavLink>
      </div>

    </div>
  );
}