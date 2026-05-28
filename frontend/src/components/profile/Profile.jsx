import { useAuth } from '../../hooks/useAuth';
import { User, LogOut, Info, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function Profile() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gray-100 text-gray-600 rounded-xl">
          <User size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('profile.title') || 'My Profile'}</h1>
          <p className="text-gray-500 text-sm">{t('profile.subtitle') || 'Manage your account and view project credits'}</p>
        </div>
      </div>

      {/* User Card */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-4xl font-bold flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'Guest User'}</h2>
          <p className="text-gray-500 flex items-center justify-center md:justify-start gap-2 mt-1">
            <User size={16} />
            {user?.email || 'No email provided'}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition w-full md:w-auto justify-center"
        >
          <LogOut size={18} />
          {t('profile.logout') || 'Logout'}
        </button>
      </div>

      {/* About Project Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
          <Info size={20} className="text-indigo-600" />
          <h3 className="font-bold text-gray-800">📌 {t('profile.aboutTitle') || 'About the Project'}</h3>
        </div>
        <div className="p-8 space-y-6">
          <p className="text-gray-600 leading-relaxed">
            {t('profile.aboutP1') || 'The Smart Inventory Crud Web Application With NLP is a web-based system that helps manage inventory in a simple and efficient way. It allows users to add, view, update, and delete product data easily.'}
          </p>
          <p className="text-gray-600 leading-relaxed">
            {t('profile.aboutP2') || 'What makes this system "smart" is the use of Natural Language Processing (NLP). Users can give commands in simple language instead of going through complex steps, making the system faster and easier to use.'}
          </p>
          <p className="text-gray-600 leading-relaxed">
            {t('profile.aboutP3') || 'This project shows how modern technology can improve traditional inventory systems by making them more user-friendly and intelligent.'}
          </p>
        </div>
      </div>

      {/* Developers Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
          <Users size={20} className="text-indigo-600" />
          <h3 className="font-bold text-gray-800">👨‍💻 {t('profile.developedBy') || 'Developed By'}</h3>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <div>
                  <p className="font-bold text-gray-800">Om Ashok Shedage</p>
                  <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">PRN: 2267571242112</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <div>
                  <p className="font-bold text-gray-800">Rohit Rajendra Gaikwad</p>
                  <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">PRN: 2267571242113</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <div>
                  <p className="font-bold text-gray-800">Prathmesh Gajanan Sose</p>
                  <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">PRN: 2267571242114</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <div>
                  <p className="font-bold text-gray-800">Sujit Bhauso Chavan</p>
                  <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">PRN: 2267571242115</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <div>
                  <p className="font-bold text-gray-800">Jay Sanjay Ithape</p>
                  <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">PRN: 2267571242120</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

