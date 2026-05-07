import { useState, useEffect, useRef } from "react";
import { chatService } from "../../services/chatService";
import {
  Bot,
  User,
  Send,
  Sparkles,
  Package,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

export default function ChatInterface() {
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
        content: "👋 Hi! I'm VoiceStock AI, your inventory assistant. How can I help you today?",
        type: "conversation"
      }]);
    }
  }, []);

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
      const response = await chatService.sendMessage(userMessage.content, sessionId);
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
    { icon: Package, label: "Show inventory",      text: "What products do I have?" },
    { icon: AlertTriangle, label: "Low stock",     text: "Show me low stock items" },
    { icon: TrendingUp, label: "Inventory value",  text: "What's my total inventory value?" },
    { icon: Sparkles, label: "Add stock",          text: "Add 50 laptops" },
    { icon: Sparkles, label: "Remove stock",       text: "Remove 10 chairs" },
    { icon: Sparkles, label: "Dead stock",         text: "Show dead stock items" },
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
            <h1 className="text-2xl font-bold text-gray-800">AI Chat Assistant</h1>
            <p className="text-gray-500 text-sm">Control inventory and query data using natural language</p>
          </div>
        </div>
      </div>

      {/* 3-COLUMN LAYOUT WITH FLEX-1 MIN-H-0 TO PREVENT PAGE SCROLLING */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 pb-6">
        
        {/* LEFT PANEL */}
        <div className="col-span-3 bg-white border rounded-2xl shadow-sm p-5 flex flex-col h-full min-h-0">
          <h3 className="font-semibold mb-4 flex items-center gap-2 shrink-0">
            <Bot size={18} /> Conversations
          </h3>
          <div className="p-3 bg-indigo-50 rounded-lg flex items-center gap-2 mb-6 shrink-0">
            <Bot size={16} /> Inventory Bot
          </div>
          <h4 className="text-sm font-semibold text-gray-600 mb-3 shrink-0">
            Command Log
          </h4>
          <div className="space-y-2 overflow-y-auto flex-1 pr-2">
            {commandLogs.length === 0 && (
              <p className="text-xs text-gray-400">No commands executed yet</p>
            )}
            {commandLogs.map((cmd, i) => (
              <div key={i} className="text-xs p-2 border rounded-lg bg-gray-50">
                <div className="font-medium text-gray-700">{cmd.content}</div>
                <div className="text-green-600">✔ Executed</div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER CHAT PANEL */}
        <div className="col-span-6 bg-white border rounded-2xl shadow-sm flex flex-col h-full min-h-0 relative">
          
          {/* CENTER HEADER */}
          <div className="p-4 border-b flex items-center gap-3 shrink-0 bg-white z-10 rounded-t-2xl">
            <Bot size={20} />
            <h2 className="font-semibold text-gray-800">Kognio Inventory Assistant</h2>
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
                      <Bot size={14} /> AI
                    </div>
                  )}
                  {msg.role === "user" && (
                    <div className="text-xs text-indigo-100 mb-1 flex items-center gap-1">
                      <User size={14} /> You
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  
                  {msg.data && msg.type === "command" && (
                    <div className="mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded w-max">
                      ✔ Command executed
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Sparkles size={16} className="animate-pulse" /> AI thinking...
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* INPUT BAR (ALWAYS FIXED AT BOTTOM OF CENTER PANEL) */}
          <form onSubmit={handleSubmit} className="shrink-0 border-t p-4 flex gap-3 bg-white rounded-b-2xl">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about inventory..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition"
            >
              <Send size={16} /> Send
            </button>
          </form>

        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-3 bg-white border rounded-2xl shadow-sm p-5 flex flex-col h-full min-h-0">
          <h3 className="font-semibold mb-4 flex items-center gap-2 shrink-0">
            <Sparkles size={18} /> Quick Commands
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