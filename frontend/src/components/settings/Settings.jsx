import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, Check, Settings, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const { language, changeLanguage, t } = useLanguage();
  const [saveStatus, setSaveStatus] = useState('');

  const languageOptions = [
    { code: 'en', name: 'English', nativeName: 'English', desc: 'Standard system language' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', desc: 'सिस्टम की हिंदी भाषा' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', desc: 'सिस्टमची मराठी भाषा' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', desc: 'அமைப்பின் தமிழ் மொழி' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', desc: 'ਸਿਸਟਮ ਦੀ ਪੰਜਾਬੀ ਭਾਸ਼ਾ' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', desc: 'સિસ્ટમની ગુજરાતી ભાષા' }
  ];

  const handleLanguageSelect = (code) => {
    changeLanguage(code);
    setSaveStatus(t('settings.successMsg'));
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
            <Settings size={24} className="animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('settings.title')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('settings.subtitle')}</p>
          </div>
        </div>
        {saveStatus && (
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl border border-emerald-100 shadow-sm animate-fade-in">
            {saveStatus}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Settings Navigation Menu */}
        <div className="md:col-span-1 space-y-2">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-semibold text-sm transition text-left">
              <Globe size={18} />
              Language & Region
            </button>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-2xl text-white shadow-md relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-10">
              <Sparkles size={120} />
            </div>
            <h4 className="font-bold text-base flex items-center gap-1.5">
              <Sparkles size={18} />
              Multi-lingual NLP
            </h4>
            <p className="text-xs text-indigo-100 mt-2 leading-relaxed">
              Select your native language. The voice controls and core dashboard will adapt instantly to assist you.
            </p>
          </div>
        </div>

        {/* Right Settings Form Container */}
        <div className="md:col-span-2 space-y-6">
          {/* Language selection panel */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Globe size={20} className="text-indigo-500" />
                {t('settings.languageLabel')}
              </h3>
              <p className="text-gray-500 text-xs mt-1">Select the language you want to apply across the entire smart inventory dashboard.</p>
            </div>

            {/* Language grid cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {languageOptions.map((option) => {
                const isActive = language === option.code;
                return (
                  <button
                    key={option.code}
                    onClick={() => handleLanguageSelect(option.code)}
                    className={`p-4 rounded-2xl border text-left flex items-start justify-between transition-all duration-200 group relative ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500'
                        : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <p className={`text-base font-bold transition-colors ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {option.nativeName}
                      </p>
                      <p className={`text-xs mt-0.5 ${isActive ? 'text-indigo-500/80 font-medium' : 'text-gray-400'}`}>
                        {option.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-2 line-clamp-1">
                        {option.desc}
                      </p>
                    </div>

                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-indigo-600 text-white scale-100' 
                        : 'bg-gray-50 text-transparent group-hover:bg-gray-100 scale-90'
                    }`}>
                      <Check size={14} className={isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 text-gray-400'} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Info card */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
            <h4 className="font-bold text-gray-700 text-sm">💡 Quick System Tip</h4>
            <ul className="text-xs text-gray-500 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                Changing the language automatically adjusts menu options, tooltips, analytical headers, and form titles.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                The system uses localStorage to persist your language preferences, so it stays active even if you refresh or reopen the app later.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
