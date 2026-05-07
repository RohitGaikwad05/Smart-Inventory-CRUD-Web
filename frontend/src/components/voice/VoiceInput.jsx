import { useState } from "react";
import { chatService } from "../../services/chatService";
import { Mic, Square, Loader2, Volume2, CheckCircle2, History, AlertCircle } from "lucide-react";

const SUPPORTED_LANGUAGES = [
  { code: "en-US", name: "English (US)" },
  { code: "en-IN", name: "English (India)" },
  { code: "hi-IN", name: "Hindi (हिंदी)" },
  { code: "mr-IN", name: "Marathi (मराठी)" },
  { code: "gu-IN", name: "Gujarati (ગુજરાતી)" },
  { code: "ta-IN", name: "Tamil (தமிழ்)" },
  { code: "te-IN", name: "Telugu (తెలుగు)" }
];

export default function VoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState(null);

  const [processing, setProcessing] = useState(false);
  const [awaitConfirm, setAwaitConfirm] = useState(false);

  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("Ready");

  const [language, setLanguage] = useState("hi-IN");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  /* TEXT TO SPEECH */
  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  /* STOP SPEAKING */
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  /* START LISTENING */
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Speech recognition not supported");
      return;
    }
    const rec = new webkitSpeechRecognition();
    rec.lang = language;
    rec.continuous = false;
    rec.interimResults = false;
    setRecognition(rec);
    rec.onstart = () => {
      setIsListening(true);
      setStatus("Listening...");
      setTranscript("");
      setResponse(null);
      setError(null);
    };
    rec.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      confirmCommand(text);
    };
    rec.onerror = (event) => {
      setError(event.error);
      setIsListening(false);
      setStatus("Error: " + event.error);
    };
    rec.onend = () => setIsListening(false);
    rec.start();
  };

  /* STOP MIC */
  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
    setStatus("Ready");
  };

  /* CONFIRM COMMAND BEFORE EXECUTION */
  const confirmCommand = (text) => {
    setAwaitConfirm(true);
    setStatus("Awaiting Confirmation");
  };

  /* EXECUTE COMMAND */
  const executeCommand = async () => {
    setProcessing(true);
    setStatus("Processing Command...");
    try {
      const result = await chatService.sendMessage(transcript);
      setResponse(result.data);
      setHistory(prev => [
        {
          command: transcript,
          result: result.data.response,
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      setStatus("Command Executed Successfully");
      
      if (result.data.type === "command") {
        window.dispatchEvent(new Event("inventoryUpdated"));
      }

      if (autoSpeak && result.data.response) {
        speak(result.data.response);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.response || "Command Failed";
      setError(errorMsg);
      setStatus("Failed");
      if (autoSpeak) speak(errorMsg);
    } finally {
      setProcessing(false);
      setAwaitConfirm(false);
    }
  };

  /* SUGGESTIONS */
  const suggestions = [
    "Add 50 laptops",
    "Remove 10 mouse",
    "Show inventory",
    "What is inventory value",
    "Create product GPU price 30000"
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-pink-100 text-pink-600 rounded-xl">
          <Mic size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Voice Assistant</h1>
          <p className="text-gray-500 text-sm">Use multi-lingual voice commands to control your inventory</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
            
            {/* STATUS BADGE */}
            <div className={`mb-10 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
              isListening ? "bg-pink-50 text-pink-600 border border-pink-100" :
              processing ? "bg-blue-50 text-blue-600 border border-blue-100" :
              "bg-gray-50 text-gray-600 border border-gray-200"
            }`}>
              {isListening && <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />}
              {status}
            </div>

            {/* MIC ORB */}
            <div className="relative mb-8 flex justify-center">
              <button
                onClick={startListening}
                disabled={isListening || processing}
                className={`w-40 h-40 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 z-10 relative
                  ${isListening ? "bg-gradient-to-tr from-pink-500 to-rose-500 scale-110" : 
                    processing ? "bg-gradient-to-tr from-blue-500 to-cyan-500" : 
                    "bg-gradient-to-tr from-indigo-500 to-purple-600 hover:scale-105"}`}
              >
                {processing ? <Loader2 className="animate-spin" size={48} /> : <Mic size={48} />}
              </button>

              {/* RIPPLE EFFECT */}
              {isListening && (
                <>
                  <div className="absolute inset-0 bg-pink-400 rounded-full animate-ping opacity-30" />
                  <div className="absolute inset-[-20px] bg-pink-300 rounded-full animate-ping opacity-20" style={{ animationDelay: '200ms' }} />
                </>
              )}
            </div>

            {/* WAVEFORM ANIMATION */}
            {isListening && (
              <div className="flex justify-center gap-1 mb-6 h-12 items-end">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-pink-500 rounded-t-full animate-bounce"
                    style={{
                      height: Math.random() * 40 + 10,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            )}

            {isListening && (
              <button
                onClick={stopListening}
                className="flex items-center gap-2 text-rose-500 hover:bg-rose-50 px-4 py-2 rounded-xl transition font-medium"
              >
                <Square size={16} /> Stop Listening
              </button>
            )}

          </div>

          {/* SETTINGS */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Voice Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Spoken Language</label>
                <select 
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Output & History */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* TRANSCRIPT & CONFIRMATION */}
          {transcript && (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Mic size={100} />
              </div>
              <h3 className="text-indigo-200 font-medium mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                I Heard You Say
              </h3>
              <p className="text-3xl font-bold leading-tight mb-6">"{transcript}"</p>

              {awaitConfirm && (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <span className="font-medium text-indigo-50">Execute this command?</span>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setAwaitConfirm(false)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeCommand}
                      className="flex-1 sm:flex-none px-6 py-2 bg-white text-indigo-700 hover:bg-gray-50 rounded-xl transition text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ERROR ALERT */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-6 rounded-3xl flex gap-3">
              <AlertCircle className="shrink-0" />
              <div>
                <h3 className="font-bold mb-1">Command Failed</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* AI RESPONSE */}
          {response && !error && (
            <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 uppercase tracking-wider">
                  <CheckCircle2 size={14} /> AI Response
                </div>
                {isSpeaking && (
                  <button onClick={stopSpeaking} className="text-rose-500 hover:bg-rose-50 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 transition">
                    <Square size={14} /> Stop
                  </button>
                )}
                {!autoSpeak && !isSpeaking && (
                  <button onClick={() => speak(response.response)} className="text-indigo-500 hover:bg-indigo-50 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 transition">
                    <Volume2 size={14} /> Listen
                  </button>
                )}
              </div>
              <p className="text-gray-800 text-lg font-medium leading-relaxed">
                {response.response}
              </p>
            </div>
          )}

          {/* HISTORY */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <History size={18} className="text-gray-400" /> Recent Commands
            </h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No commands recorded in this session.</p>
                  
                  <div className="mt-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Try saying:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestions.map((s, i) => (
                        <button key={i} onClick={() => setTranscript(s)} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-600 font-medium transition">
                          "{s}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 shrink-0 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                      <Mic size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">"{h.command}"</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{h.result}</p>
                      <p className="text-xs text-gray-400 mt-2">{h.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}