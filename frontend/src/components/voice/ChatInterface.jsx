import { useState, useEffect, useRef } from "react";
import { chatService } from "../../services/chatService";
import { useLanguage } from "../../context/LanguageContext";
import {
  Bot,
  User,
  Send,
  Sparkles,
  Package,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

const localChatT = {
  en: {
    title: "AI Chat Assistant",
    subtitle: "Control inventory and query data using natural language",
    conversations: "Conversations",
    botName: "Inventory Bot",
    commandLog: "Command Log",
    noCommands: "No commands executed yet",
    executed: "Executed",
    assistantName: "Smart Inventory Crud Web Application With NLP Assistant",
    thinking: "AI is thinking...",
    placeholder: "Ask about inventory...",
    send: "Send",
    welcome: "👋 Hi! I'm your Smart Inventory Assistant. How can I help you today?",
    you: "You",
    ai: "AI",
    executedBadge: "Command executed",
    quickCommands: "Quick Commands",
    qShowInventory: "Show inventory",
    qLowStock: "Low stock",
    qValue: "Inventory value",
    qAddStock: "Add stock",
    qRemoveStock: "Update Price",
    qDeadStock: "Dead stock"
  },
  mr: {
    title: "एआय चॅट सहाय्यक",
    subtitle: "नैसर्गिक भाषा वापरून इन्व्हेंटरी नियंत्रित करा आणि डेटा विचारा",
    conversations: "संभाषणे",
    botName: "इन्व्हेंटरी बॉट",
    commandLog: "आज्ञा लॉग",
    noCommands: "अद्याप कोणत्याही आज्ञा कार्यान्वित केलेल्या नाहीत",
    executed: "कार्यान्वित",
    assistantName: "स्मार्ट इन्व्हेंटरी क्रड वेब ॲप्लिकेशन विथ एनएलपी सहाय्यक",
    thinking: "एआय विचार करत आहे...",
    placeholder: "इन्व्हेंटरीबद्दल विचारा...",
    send: "पाठवा",
    welcome: "👋 नमस्कार! मी तुमचा स्मार्ट इन्व्हेंटरी सहाय्यक आहे. मी आज तुमची काय मदत करू शकतो?",
    you: "तुम्ही",
    ai: "एआय",
    executedBadge: "आज्ञा कार्यान्वित झाली",
    quickCommands: "जलद आज्ञा",
    qShowInventory: "इन्व्हेंटरी दाखवा",
    qLowStock: "कमी स्टॉक",
    qValue: "इन्व्हेंटरी मूल्य",
    qAddStock: "स्टॉक जोडा",
    qRemoveStock: "किंमत बदला",
    qDeadStock: "डेड स्टॉक"
  },
  hi: {
    title: "एआई चैट सहायक",
    subtitle: "प्राकृतिक भाषा का उपयोग करके इन्वेंटरी नियंत्रित करें और डेटा पूछें",
    conversations: "बातचीत",
    botName: "इवेंटरी बॉट",
    commandLog: "कमांड लॉग",
    noCommands: "अभी तक कोई कमांड निष्पादित नहीं की गई है",
    executed: "निष्पादित",
    assistantName: "स्मार्ट इन्वेंटरी क्रड वेब एप्लिकेशन विद एनएलपी सहायक",
    thinking: "एआई विचार कर रहा है...",
    placeholder: "इवेंटरी के बारे में पूछें...",
    send: "भेजें",
    welcome: "👋 नमस्ते! मैं आपका स्मार्ट इन्वेंटरी सहायक हूं। आज मैं आपकी क्या सहायता कर सकता हूं?",
    you: "आप",
    ai: "एआई",
    executedBadge: "कमांड निष्पादित की गई",
    quickCommands: "त्वरित कमांड",
    qShowInventory: "इन्वेंटरी दिखाएं",
    qLowStock: "कम स्टॉक",
    qValue: "इवेंटरी मूल्य",
    qAddStock: "स्टॉक जोड़ें",
    qRemoveStock: "कीमत बदलें",
    qDeadStock: "डेड स्टॉक"
  },
  ta: {
    title: "AI அரட்டை உதவியாளர்",
    subtitle: "இயற்கையான மொழியைப் பயன்படுத்தி சரக்குகளைக் கட்டுப்படுத்தித் தரவுகளைக் கேளுங்கள்",
    conversations: "உரையாடல்கள்",
    botName: "சரக்கு பாட்",
    commandLog: "கட்டளை பதிவு",
    noCommands: "இதுவரை எந்தக் கட்டளையும் இயக்கப்படவில்லை",
    executed: "இயக்கப்பட்டது",
    assistantName: "ஸ்மார்ட் சரக்கு CRUD NLP உதவியாளர்",
    thinking: "AI யோசிக்கிறது...",
    placeholder: "சரக்கு பற்றி கேளுங்கள்...",
    send: "அனுப்பு",
    welcome: "👋 வணக்கம்! நான் உங்கள் ஸ்மார்ட் சரக்கு உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
    you: "நீங்கள்",
    ai: "AI",
    executedBadge: "கட்டளை இயக்கப்பட்டது",
    quickCommands: "விரைவுக் கட்டளைகள்",
    qShowInventory: "சரக்குகளைக் காட்டு",
    qLowStock: "குறைந்த சரக்கு",
    qValue: "சரக்கு மதிப்பு",
    qAddStock: "சரக்குச் சேர்",
    qRemoveStock: "விலையை மாற்று",
    qDeadStock: "தேக்கச் சரக்கு"
  },
  pa: {
    title: "AI ਚੈਟ ਸਹਾਇਕ",
    subtitle: "ਕੁਦਰਤੀ ਭਾਸ਼ਾ ਦੀ ਵਰਤੋਂ ਕਰਕੇ ਇਨਵੈਂਟਰੀ ਨੂੰ ਨਿਯੰਤਰਿਤ ਕਰੋ ਅਤੇ ਡੇਟਾ ਪੁੱਛੋ",
    conversations: "ਗੱਲਬਾਤ",
    botName: "ਇਨਵੈਂਟਰੀ ਬੋਟ",
    commandLog: "ਕਮਾਂਡ ਲੌਗ",
    noCommands: "ਅਜੇ ਤੱਕ ਕੋਈ ਕਮਾਂਡ ਲਾਗੂ ਨਹੀਂ ਕੀਤੀ ਗਈ",
    executed: "ਲਾਗੂ ਕੀਤਾ",
    assistantName: "ਸਮਾਰਟ ਇਨਵੈਂਟਰੀ CRUD NLP ਸਹਾਇਕ",
    thinking: "AI ਸੋਚ ਰਿਹਾ ਹੈ...",
    placeholder: "ਇਨਵੈਂਟਰੀ ਬਾਰੇ ਪੁੱਛੋ...",
    send: "ਭੇਜੋ",
    welcome: "👋 ਨਮਸਤੇ! ਮੈਂ ਤੁਹਾਡਾ ਸਮਾਰਟ ਇਨਵੈਂਟਰੀ ਸਹਾਇਕ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
    you: "ਤੁਸੀਂ",
    ai: "AI",
    executedBadge: "ਕਮਾਂਡ ਲਾਗੂ ਕੀਤੀ ਗਈ",
    quickCommands: "ਤੁਰੰਤ ਕਮਾਂਡਾਂ",
    qShowInventory: "ਇਨਵੈਂਟਰੀ ਦਿਖਾਓ",
    qLowStock: "ਘੱਟ ਸਟਾਕ",
    qValue: "ਇਨਵੈਂਟਰੀ ਮੁੱਲ",
    qAddStock: "ਸਟਾਕ ਜੋੜੋ",
    qRemoveStock: "ਕੀਮਤ ਬਦਲੋ",
    qDeadStock: "ਡੇਡ ਸਟਾਕ"
  },
  gu: {
    title: "AI ચેટ મદદનીશ",
    subtitle: "કુદ૨તી ભાષાનો ઉપયોગ કરીને ઇન્વેન્ટરી નિયંત્રિત કરો અને ડેટા પૂછો",
    conversations: "વાતચીત",
    botName: "ઇન્વેન્ટરી બોટ",
    commandLog: "કમાન્ડ લોગ",
    noCommands: "હજી સુધી કોઈ કમાન્ડ અમલમાં મૂકવામાં આવી નથી",
    executed: "અમલમાં મૂકેલ",
    assistantName: "સ્માર્ટ ઇન્વેન્ટરી CRUD NLP મદદનીશ",
    thinking: "AI વિચારી રહ્યું છે...",
    placeholder: "ઇન્વેન્ટરી વિશે પૂછો...",
    send: "મોકલો",
    welcome: "👋 નમસ્તે! હું તમારો સ્માર્ટ ઇન્વેન્ટરી મદદનીશ છું. આજે હું તમારી શું મદદ કરી શકું?",
    you: "તમે",
    ai: "AI",
    executedBadge: "કમાન્ડ અમલમાં મુકાઈ",
    quickCommands: "ઝડપી કમાન્ડ્સ",
    qShowInventory: "ઇન્વેન્ટરી બતાવો",
    qLowStock: "ઓછો સ્ટોક",
    qValue: "ઇન્વેન્ટરી મૂલ્ય",
    qAddStock: "સ્ટોક ઉમેરો",
    qRemoveStock: "કિંમત બદલો",
    qDeadStock: "ડેડ સ્ટોક"
  }
};

export default function ChatInterface() {
  const { language } = useLanguage();
  const cl = localChatT[language] || localChatT.en;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [sessionId] = useState(() => {
    const saved = localStorage.getItem("chat_session_id");
    if (saved) return saved;
    const id = "session_" + Date.now();
    localStorage.setItem("chat_session_id", id);
    return id;
  });

  const messagesEndRef = useRef(null);
  const firstLoad = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /* ONLY SCROLL WHEN NEW MESSAGE ARRIVES */
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    scrollToBottom();
  }, [messages]);

  /* LOAD CHAT HISTORY */
  useEffect(() => {
    const savedChat = localStorage.getItem("chat_history");
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    } else {
      setMessages([{
        role: "assistant",
        content: cl.welcome,
        type: "conversation"
      }]);
    }
  }, [cl.welcome]); // Reload welcome if language changes on empty state

  /* SAVE CHAT */
  useEffect(() => {
    if (messages.length) {
      localStorage.setItem("chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  /* COMMAND LOG */
  const commandLogs = messages
    .filter(m => m.type === "command")
    .slice(-8)
    .reverse();

  /* SEND MESSAGE */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const cleanLang = language.startsWith("mr") ? "mr" : (language.startsWith("hi") ? "hi" : "en");
      const response = await chatService.sendMessage(userMessage.content, sessionId, cleanLang);
      const aiMessage = {
        role: "assistant",
        content: response.data.response,
        type: response.data.type,
        data: response.data.data
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (response.data.type === "command") {
        window.dispatchEvent(new Event("inventoryUpdated"));
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: "error",
          content: error.response?.data?.response || "Error processing command"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* QUICK COMMANDS */
  const quickCommands = [
    { icon: Package, label: cl.qShowInventory, text: language === 'mr' ? "इन्व्हेंटरी दाखवा" : (language === 'hi' ? "इन्वेंटरी दिखाएं" : "What products do I have?") },
    { icon: AlertTriangle, label: cl.qLowStock, text: language === 'mr' ? "कमी स्टॉक असलेली सर्व उत्पादने दाखवा" : (language === 'hi' ? "कम स्टॉक वाले उत्पाद दिखाएं" : "Show me low stock items") },
    { icon: TrendingUp, label: cl.qValue, text: language === 'mr' ? "एकूण इन्व्हेंटरी मूल्य काय आहे?" : (language === 'hi' ? "कुल इन्वेंटरी मूल्य क्या है?" : "What's my total inventory value?") },
    { icon: Sparkles, label: cl.qAddStock, text: language === 'mr' ? "स्टॉकमध्ये ५० लॅपटॉप जोडा" : (language === 'hi' ? "स्टॉक में 50 लैपटॉप जोड़ें" : "Add 50 laptops") },
    { icon: Sparkles, label: cl.qRemoveStock, text: language === 'mr' ? "टेबलची किंमत १५०० पर्यंत अपडेट करा" : (language === 'hi' ? "टेबल की कीमत 1500 तक अपडेट करें" : "Update price of Table to 1500") },
    { icon: Sparkles, label: cl.qDeadStock, text: language === 'mr' ? "डेड स्टॉक दाखवा" : (language === 'hi' ? "डेड स्टॉक दिखाएं" : "Show dead stock items") }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-7xl mx-auto w-full">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{cl.title}</h1>
            <p className="text-gray-500 text-sm">{cl.subtitle}</p>
          </div>
        </div>
      </div>

      {/* 3-COLUMN LAYOUT WITH FLEX-1 MIN-H-0 TO PREVENT PAGE SCROLLING */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 pb-6">
        
        {/* LEFT PANEL */}
        <div className="col-span-3 bg-white border rounded-2xl shadow-sm p-5 flex flex-col h-full min-h-0">
          <h3 className="font-semibold mb-4 flex items-center gap-2 shrink-0">
            <Bot size={18} /> {cl.conversations}
          </h3>
          <div className="p-3 bg-indigo-50 rounded-lg flex items-center gap-2 mb-6 shrink-0">
            <Bot size={16} /> {cl.botName}
          </div>
          <h4 className="text-sm font-semibold text-gray-600 mb-3 shrink-0">
            {cl.commandLog}
          </h4>
          <div className="space-y-2 overflow-y-auto flex-1 pr-2">
            {commandLogs.length === 0 && (
              <p className="text-xs text-gray-400">{cl.noCommands}</p>
            )}
            {commandLogs.map((cmd, i) => (
              <div key={i} className="text-xs p-2 border rounded-lg bg-gray-50">
                <div className="font-medium text-gray-700">{cmd.content}</div>
                <div className="text-green-600">✔ {cl.executed}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER CHAT PANEL */}
        <div className="col-span-6 bg-white border rounded-2xl shadow-sm flex flex-col h-full min-h-0 relative">
          
          {/* CENTER HEADER */}
          <div className="p-4 border-b flex items-center gap-3 shrink-0 bg-white z-10 rounded-t-2xl">
            <Bot size={20} />
            <h2 className="font-semibold text-gray-800">{cl.assistantName}</h2>
          </div>

          {/* MESSAGE AREA (SCROLLS INDEPENDENTLY) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-4 py-3 rounded-xl text-sm ${
                  msg.role === "user" ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white" : 
                  msg.role === "error" ? "bg-red-500 text-white" : 
                  "bg-gray-50 border border-gray-100 text-gray-800"
                }`}>
                  {msg.role === "assistant" && (
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Bot size={14} /> {cl.ai}
                    </div>
                  )}
                  {msg.role === "user" && (
                    <div className="text-xs text-indigo-100 mb-1 flex items-center gap-1">
                      <User size={14} /> {cl.you}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  
                  {msg.data && msg.type === "command" && (
                    <div className="mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded w-max">
                      ✔ {cl.executedBadge}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Sparkles size={16} className="animate-pulse" /> {cl.thinking}
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* INPUT BAR (ALWAYS FIXED AT BOTTOM OF CENTER PANEL) */}
          <form onSubmit={handleSubmit} className="shrink-0 border-t p-4 flex gap-3 bg-white rounded-b-2xl">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={cl.placeholder}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition"
            >
              <Send size={16} /> {cl.send}
            </button>
          </form>

        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-3 bg-white border rounded-2xl shadow-sm p-5 flex flex-col h-full min-h-0">
          <h3 className="font-semibold mb-4 flex items-center gap-2 shrink-0">
            <Sparkles size={18} /> {cl.quickCommands}
          </h3>
          <div className="space-y-3 overflow-y-auto pr-2">
            {quickCommands.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={i}
                  onClick={() => setInput(cmd.text)}
                  className="w-full flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:border-indigo-300 hover:shadow-sm text-sm transition text-left group bg-white"
                >
                  <Icon size={16} className="text-gray-400 group-hover:text-indigo-500 transition" />
                  <span className="text-gray-700 font-medium group-hover:text-indigo-700 transition">{cmd.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}