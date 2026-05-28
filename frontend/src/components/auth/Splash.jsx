import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles, Radio, Cpu } from 'lucide-react';

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    const timer = setTimeout(() => {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-white">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Brand Logo */}
        <div className="relative w-32 h-32 mb-8 animate-pulse shadow-2xl rounded-3xl flex items-center justify-center bg-white border-4 border-[#5438dc]/10 p-4">
            <img src="/logo.png" alt="Smart Inventory Crud Web Application With NLP Logo" className="w-full h-full object-contain" />
        </div>
        
        <div className="flex flex-col items-center mb-2">
          <h1 className="text-2xl font-bold text-[#5438dc] tracking-tight text-center">Smart Inventory Crud Web Application With NLP</h1>
        </div>
        <p className="text-xs text-gray-400 tracking-widest uppercase font-medium">Inventory, Powered by Intelligence</p>
      </div>

      <div className="pb-8 flex flex-col items-center gap-4 text-gray-400">
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm">© 2026 Smart Inventory CRUD Web Application With NLP.</p>
        </div>
        <div className="flex gap-4">
          <Sparkles size={16} />
          <Radio size={16} />
          <Cpu size={16} />
        </div>
      </div>
    </div>
  );
}
