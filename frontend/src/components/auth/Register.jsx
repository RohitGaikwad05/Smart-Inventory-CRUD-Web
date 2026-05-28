import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, Sparkles, Zap } from 'lucide-react';
import GoogleAuthModal from './GoogleAuthModal';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSelect = async (account) => {
    setIsGoogleModalOpen(false);
    try {
      let finalName = account.name;
      let finalEmail = account.email;

      if (account.isNew) {
        finalName = window.prompt("Enter your Name for Smart Inventory Crud Web Application With NLP:", "Google User");
        finalEmail = window.prompt("Enter your Gmail:", "user@gmail.com");
      }
      
      if (!finalEmail) return;

      await googleLogin({
        email: finalEmail,
        name: finalName || finalEmail.split('@')[0]
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google signup failed');
    }
  };




  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('You must agree to the Terms of Service');
      return;
    }
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel (Purple) */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#4e34c9] to-[#6042ef] flex-col p-12 text-white justify-center relative overflow-hidden">
        
        {/* Subtle background glow/blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-300 opacity-10 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-4 mb-2">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain bg-white rounded-xl p-2 shadow-lg" />
              <h1 className="text-xl font-bold leading-tight">Smart Inventory Crud Web Application With NLP</h1>
            </div>
            <div className="w-12 h-1 bg-[#00f2fe] mb-12 rounded"></div>

            <h2 className="text-5xl font-bold mb-6 leading-tight">Intelligence in Motion.</h2>
            <p className="text-lg text-indigo-100 mb-12 leading-relaxed">
                The future of logistics is here. Join operations leaders transforming inventory with AI-driven precision and enlightened logic.
            </p>

            <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Sparkles size={20} className="text-[#e2d9ff]" />
                        </div>
                        <h3 className="font-semibold text-lg">AI Health Score</h3>
                    </div>
                    <p className="text-sm text-indigo-100 ml-12">Real-time predictive insights for your inventory health.</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Zap size={20} className="text-[#e2d9ff]" />
                        </div>
                        <h3 className="font-semibold text-lg">Fast Deployment</h3>
                    </div>
                    <p className="text-sm text-indigo-100 ml-12">Seamless integration and go-live in under 24 hours.</p>
                </div>
            </div>
        </div>
      </div>

      {/* Right Panel (Form) */}
      <div className="flex-1 flex flex-col bg-[#fcfcfd]">
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24">
            <div className="max-w-md w-full mx-auto">
                <h2 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Create Account</h2>
                <p className="text-gray-500 mb-8 text-sm">Start your journey toward optimized operations.</p>

                {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5438dc] focus:border-transparent transition"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Work Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5438dc] focus:border-transparent transition"
                            placeholder="john@company.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="block w-full px-4 pr-10 py-3 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5438dc] focus:border-transparent transition"
                                placeholder="Min. 8 characters"
                                required
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start mt-4 mb-6">
                        <div className="flex items-center h-5">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-[#5438dc] focus:ring-[#5438dc]"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="terms" className="font-medium text-gray-600">
                                I agree to the <a href="#" className="text-[#5438dc] font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-[#5438dc] font-semibold hover:underline">Privacy Policy</a>.
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#5438dc] hover:bg-[#4226b5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5438dc] transition"
                    >
                        Create Account <span className="ml-2">→</span>
                    </button>
                </form>

                <div className="mt-8">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-[#fcfcfd] text-gray-500 uppercase tracking-wider text-xs font-bold">OR CONTINUE WITH</span>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <button 
                          onClick={() => setIsGoogleModalOpen(true)}
                          type="button"
                          className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm">
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.72 17.57V20.34H19.29C21.37 18.42 22.56 15.58 22.56 12.25Z" fill="#4285F4"/>
                                <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.72 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13 18.63 6.7 16.69 5.82 14.1H2.15V16.94C3.96 20.53 7.69 23 12 23Z" fill="#34A853"/>
                                <path d="M5.82 14.1C5.59 13.44 5.46 12.73 5.46 12C5.46 11.27 5.59 10.56 5.82 9.9V7.06H2.15C1.4 8.55 0.96 10.23 0.96 12C0.96 13.77 1.4 15.45 2.15 16.94L5.82 14.1Z" fill="#FBBC05"/>
                                <path d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.02L19.36 3.86C17.46 2.09 14.97 1 12 1C7.69 1 3.96 3.47 2.15 7.06L5.82 9.9C6.7 7.31 9.13 5.38 12 5.38Z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                        </button>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account? <Link to="/login" className="font-bold text-[#5438dc] hover:text-[#4226b5]">Log In</Link>
                    </p>
                </div>
            </div>
        </div>

        <GoogleAuthModal 
          isOpen={isGoogleModalOpen} 
          onClose={() => setIsGoogleModalOpen(false)} 
          onSelect={handleGoogleSelect} 
        />

        
        {/* Footer for Register */}
        <footer className="p-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 bg-white">
            <div>
            <div className="flex items-center gap-3 mb-1">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
              <span className="font-bold text-[#5438dc] text-base">Smart Inventory Crud Web Application With NLP</span>
            </div>
            <p>© 2026 Smart Inventory Crud Web Application With NLP. All rights reserved.</p>
            </div>
            <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-gray-900">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900">Terms of Service</a>
            <a href="#" className="hover:text-gray-900">Security</a>
            <a href="#" className="hover:text-gray-900">Contact Us</a>
            </div>
        </footer>
      </div>
    </div>
  );
}
