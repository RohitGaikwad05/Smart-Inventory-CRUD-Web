import { X } from 'lucide-react';

export default function GoogleAuthModal({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  const mockAccounts = [
    { name: 'Rohit Gaikwad', email: 'gaikwadrohit8351@gmail.com', avatar: 'RG' },
    { name: 'Admin User', email: 'admin@smartinventory.app', avatar: 'A' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[400px] rounded-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Google Header */}
        <div className="p-6 text-center border-b border-gray-100">
          <div className="flex justify-center mb-4">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.72 17.57V20.34H19.29C21.37 18.42 22.56 15.58 22.56 12.25Z" fill="#4285F4"/>
              <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.72 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13 18.63 6.7 16.69 5.82 14.1H2.15V16.94C3.96 20.53 7.69 23 12 23Z" fill="#34A853"/>
              <path d="M5.82 14.1C5.59 13.44 5.46 12.73 5.46 12C5.46 11.27 5.59 10.56 5.82 9.9V7.06H2.15C1.4 8.55 0.96 10.23 0.96 12C0.96 13.77 1.4 15.45 2.15 16.94L5.82 14.1Z" fill="#FBBC05"/>
              <path d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.02L19.36 3.86C17.46 2.09 14.97 1 12 1C7.69 1 3.96 3.47 2.15 7.06L5.82 9.9C6.7 7.31 9.13 5.38 12 5.38Z" fill="#EA4335"/>
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900">Choose an account</h2>
          <p className="text-gray-600 text-sm mt-1">to continue to <span className="text-[#5438dc] font-semibold">Smart Inventory Crud Web Application With NLP</span></p>
        </div>

        {/* Account List */}
        <div className="flex-1 overflow-y-auto max-h-[300px]">
          {mockAccounts.map((account, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(account)}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition border-b border-gray-50 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-[#5438dc] text-white flex items-center justify-center font-bold">
                {account.avatar}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{account.name}</p>
                <p className="text-xs text-gray-500">{account.email}</p>
              </div>
            </button>
          ))}
          
          <button
            onClick={() => onSelect({ name: '', email: '', isNew: true })}
            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition text-left"
          >
            <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">Use another account</p>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <button onClick={onClose} className="hover:text-gray-900 font-medium">Cancel</button>
          <div className="flex gap-3">
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
}
