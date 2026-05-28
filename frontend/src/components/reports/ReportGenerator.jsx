import { useState } from "react";
import api from "../../services/api";
import jsPDF from "jspdf";
import {
  Sparkles,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const localT = {
  en: {
    dashboardTitle: "AI Health Insights Dashboard",
    healthScore: "Inventory Health Score",
    healthDesc: "Calculated based on stock movement, low stock alerts, and dead stock ratios.",
    excellent: "Excellent Health",
    good: "Good Health",
    needsAttention: "Needs Attention",
    critical: "Critical State",
    totalValue: "Total Inventory Value",
    totalProducts: "Total Unique Products",
    lowStock: "Low Stock Risks",
    deadStock: "Dead Stock (No Movement)",
    fastMovingTitle: "Top Fast-Moving Products",
    fastMovingDesc: "Highest transactional demand in the last 30 days.",
    riskOverview: "Critical Risk Areas",
    noRisks: "No low stock or dead stock risks identified! Excellent job.",
    quantity: "Qty",
    minLevel: "Min Level"
  },
  mr: {
    dashboardTitle: "एआय आरोग्य अंतर्दृष्टी डॅशबोर्ड",
    healthScore: "इन्व्हेंटरी आरोग्य स्कोअर",
    healthDesc: "स्टॉक हालचाल, कमी स्टॉक अलर्ट आणि डेड स्टॉक गुणोत्तरावर आधारित गणना.",
    excellent: "उत्कृष्ट आरोग्य",
    good: "चांगले आरोग्य",
    needsAttention: "लक्ष देणे आवश्यक आहे",
    critical: "गंभीर स्थिती",
    totalValue: "एकूण इन्व्हेंटरी मूल्य",
    totalProducts: "एकूण अद्वितीय उत्पादने",
    lowStock: "कमी स्टॉक धोके",
    deadStock: "डेड स्टॉक (हालचाल नाही)",
    fastMovingTitle: "शीर्ष जलद-फिरणारी उत्पादने",
    fastMovingDesc: "गेल्या ३० दिवसांतील सर्वाधिक व्यवहार मागणी.",
    riskOverview: "गंभीर जोखीम क्षेत्रे",
    noRisks: "कोणतेही कमी किंवा डेड स्टॉक धोके आढळले नाहीत! उत्कृष्ट काम.",
    quantity: "प्रमाण",
    minLevel: "किमान पातळी"
  },
  hi: {
    dashboardTitle: "एआई स्वास्थ्य अंतर्दृष्टि डैशबोर्ड",
    healthScore: "इन्वेंटरी स्वास्थ्य स्कोर",
    healthDesc: "स्टॉक मूवमेंट, कम स्टॉक अलर्ट और डेड स्टॉक अनुपात के आधार पर गणना की गई।",
    excellent: "उत्कृष्ट स्वास्थ्य",
    good: "अच्छा स्वास्थ्य",
    needsAttention: "ध्यान देने की आवश्यकता है",
    critical: "गंभीर स्थिति",
    totalValue: "कुल इन्वेंटरी मूल्य",
    totalProducts: "कुल अद्वितीय उत्पाद",
    lowStock: "कम स्टॉक वाले जोखिम",
    deadStock: "डेड स्टॉक (कोई गतिविधि नहीं)",
    fastMovingTitle: "शीर्ष तेजी से बिकने वाले उत्पाद",
    fastMovingDesc: "पिछले 30 दिनों में सबसे अधिक लेनदेन मांग।",
    riskOverview: "गंभीर जोखिम क्षेत्र",
    noRisks: "कोई कम या डेड स्टॉक जोखिम नहीं मिला! बहुत बढ़िया।",
    quantity: "मात्रा",
    minLevel: "न्यूनतम स्तर"
  },
  ta: {
    dashboardTitle: "AI ஆரோக்கிய நுண்ணறிவு டாஷ்போர்டு",
    healthScore: "சரக்கு ஆரோக்கிய மதிப்பெண்",
    healthDesc: "சரக்கு இயக்கம், குறைந்த சரக்கு விழிப்பூட்டல்கள் மற்றும் தேக்கச் சரக்கு விகிதங்கள் ஆகியவற்றின் அடிப்படையில் கணக்கிடப்படுகிறது.",
    excellent: "சிறந்த ஆரோக்கியம்",
    good: "நல்ல ஆரோக்கியம்",
    needsAttention: "கவணம் தேவை",
    critical: "முக்கியமான நிலை",
    totalValue: "மொத்த சரக்கு மதிப்பு",
    totalProducts: "மொத்த தனித்துவமான தயாரிப்புகள்",
    lowStock: "குறைந்த சரக்கு அபாயங்கள்",
    deadStock: "தேக்கச் சரக்கு (இயக்கமில்லை)",
    fastMovingTitle: "மிக வேகமாக விற்கும் தயாரிப்புகள்",
    fastMovingDesc: "கடந்த 30 நாட்களில் அதிக பரிவர்த்தனை தேவை கொண்டவை.",
    riskOverview: "முக்கியமான ஆபத்து பகுதிகள்",
    noRisks: "குறைந்த அல்லது தேக்கச் சரக்கு அபாயங்கள் எதுவும் கண்டறியப்படவில்லை! சிறந்த பணி.",
    quantity: "அளவு",
    minLevel: "குறைந்தபட்ச அளவு"
  },
  pa: {
    dashboardTitle: "AI ਸਿਹਤ ਇਨਸਾਈਟਸ ਡੈਸ਼ਬੋਰਡ",
    healthScore: "ਇਨਵੈਂਟਰੀ ਹੈਲਥ ਸਕੋਰ",
    healthDesc: "ਸਟਾਕ ਦੀ ਗਤੀਸ਼ੀਲਤਾ, ਘੱਟ ਸਟਾਕ ਚੇਤਾਵਨੀਆਂ, ਅਤੇ ਡੇਡ ਸਟਾਕ ਅਨੁਪਾਤ ਦੇ ਆਧਾਰ 'ਤੇ ਗਣਨਾ ਕੀਤੀ ਗਈ ਹੈ।",
    excellent: "ਸ਼ਾਨਦਾਰ ਸਿਹਤ",
    good: "ਚੰਗੀ ਸਿਹਤ",
    needsAttention: "ਧਿਆਨ ਦੇਣ ਦੀ ਲੋੜ ਹੈ",
    critical: "ਨਾਜ਼ੁਕ ਸਥਿਤੀ",
    totalValue: "ਕੁੱਲ ਇਨਵੈਂਟਰੀ ਮੁੱਲ",
    totalProducts: "ਕੁੱਲ ਵਿਲੱਖਣ ਉਤਪਾਦ",
    lowStock: "ਘੱਟ ਸਟਾਕ ਜੋਖਮ",
    deadStock: "ਡੇਡ ਸਟਾਕ (ਕੋਈ ਹਿਲਜੁਲ ਨਹੀਂ)",
    fastMovingTitle: "ਚੋਟੀ ਦੇ ਤੇਜ਼ੀ ਨਾਲ ਵਿਕਣ ਵਾਲੇ ਉਤਪਾਦ",
    fastMovingDesc: "ਪਿਛਲੇ 30 ਦਿਨਾਂ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਧ ਲੈਣ-ਦੇਣ ਦੀ ਮੰਗ।",
    riskOverview: "ਨਾਜ਼ੁਕ ਜੋਖਮ ਖੇਤਰ",
    noRisks: "ਕੋਈ ਘੱਟ ਸਟਾਕ ਜਾਂ ਡੇਡ ਸਟਾਕ ਜੋਖਮ ਨਹੀਂ ਮਿਲਿਆ! ਸ਼ਾਨਦਾਰ ਕੰਮ।",
    quantity: "ਮਾਤਰਾ",
    minLevel: "ਨਿਊਨਤਮ ਪੱਧਰ"
  },
  gu: {
    dashboardTitle: "AI હેલ્થ ઇનસાઇટ્સ ડેશબોર્ડ",
    healthScore: "ઇન્વેન્ટરી હેલ્થ સ્કોર",
    healthDesc: "સ્ટોક હિલચાલ, ઓછા સ્ટોક ચેતવણીઓ અને ડેડ સ્ટોક રેશિયોના આધારે ગણતરી કરવામાં આવે છે.",
    excellent: "ઉત્કૃષ્ટ આરોગ્ય",
    good: "સારું આરોગ્ય",
    needsAttention: "ધ્યાન આપવાની જરૂર છે",
    critical: "ગંભીર સ્થિતિ",
    totalValue: "કુલ ઇન્વેન્ટરી મૂલ્ય",
    totalProducts: "કુલ અનન્ય ઉત્પાદનો",
    lowStock: "ઓછા સ્ટોકનું જોખમ",
    deadStock: "ડેડ સ્ટોક (કોઈ હિલચાલ નહીં)",
    fastMovingTitle: "ટોચની ઝડપથી વેચાતી પ્રોડક્ટ્સ",
    fastMovingDesc: "છેલ્લા ૩૦ દિવસમાં સૌથી વધુ ટ્રાન્ઝેક્શનની માંગ.",
    riskOverview: "ગંભીર જોખમ વિસ્તારો",
    noRisks: "કોઈ ઓછા કે ડેડ સ્ટોક જોખમો મળ્યા નથી! ઉત્તમ કામ.",
    quantity: "જથ્થો",
    minLevel: "ન્યૂનતમ સ્તર"
  }
};

export default function ReportGenerator() {
  const { language, t } = useLanguage();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lt = localT[language] || localT.en;

  const lowStockCount = report?.data?.summary?.lowStockCount ?? 0;
  const deadStockCount = report?.data?.summary?.deadStockCount ?? 0;
  const outOfStockCount = report?.data?.summary?.outOfStockCount ?? 0;
  const totalProducts = report?.data?.summary?.totalProducts ?? 0;
  const totalValue = report?.data?.summary?.totalValue ?? 0;
  
  const deadPenalty = Math.min(deadStockCount * 4, 40);
  const lowStockPenalty = Math.min(lowStockCount * 3, 30);
  const overStockPenalty = Math.min((report?.data?.overStock?.length ?? 0) * 2, 20);
  const healthScore = Math.max(0, 100 - deadPenalty - lowStockPenalty - overStockPenalty);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  /* ──────────────────────────── GENERATE ──────────────────────────── */
  const generateReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/reports/generate?lang=${language}`);
      setReport(res.data);
    } catch (err) {
      setError(t('reports.errorMsg') || "Failed to generate report. Please ensure the backend is running and Groq API key is configured.");
    }
    setLoading(false);
  };

  /* ──────────────────────────── PARSE AI TEXT ──────────────────────────── */
  const formatReport = (text) => {
    if (!text) return [];
    const sections = text.split(/\*\*(.*?)\*\*/g);
    const formatted = [];
    for (let i = 1; i < sections.length; i += 2) {
      formatted.push({ title: sections[i], content: sections[i + 1] });
    }
    return formatted;
  };

  const formattedSections = formatReport(report?.report);

  /* ──────────────────────────── PDF EXPORT ──────────────────────────── */
  const downloadPDF = () => {
    if (!report) return;
    const pdf = new jsPDF("p", "mm", "a4");
    let y = 30;
    let page = 1;

    const addHeader = () => {
      pdf.setFillColor(84, 56, 220);
      pdf.rect(0, 0, 210, 18, "F");
      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont(undefined, "bold");
      pdf.text("Smart Inventory Crud Web Application With NLP", 14, 12);
      pdf.setFontSize(9);
      pdf.setFont(undefined, "normal");
      pdf.text("Inventory, Powered by Intelligence", 14, 17.5);
      pdf.setFontSize(9);
      pdf.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 150, 12);
    };

    const addFooter = (pg) => {
      pdf.setFontSize(9);
      pdf.setTextColor(150);
      pdf.text(`Smart Inventory Crud Web Application With NLP Report — Page ${pg}`, 14, 292);
      pdf.text(`Confidential`, 170, 292);
    };

    addHeader();

    pdf.setFontSize(18);
    pdf.setTextColor(30);
    pdf.setFont(undefined, "bold");
    pdf.text("AI Inventory Intelligence Report", 14, y);
    y += 6;
    pdf.setFontSize(10);
    pdf.setFont(undefined, "normal");
    pdf.setTextColor(120);
    pdf.text(`Report Date: ${new Date().toLocaleString("en-IN")}`, 14, y);
    y += 12;

    formattedSections.forEach((section) => {
      if (y > 265) {
        addFooter(page);
        pdf.addPage();
        page++;
        addHeader();
        y = 30;
      }
      pdf.setFontSize(12);
      pdf.setTextColor(79, 70, 229);
      pdf.setFont(undefined, "bold");
      pdf.text(section.title, 14, y);
      y += 7;

      pdf.setFontSize(10);
      pdf.setTextColor(50);
      pdf.setFont(undefined, "normal");

      const lines = pdf.splitTextToSize(section.content.replace(/\*/g, "").trim(), 180);
      lines.forEach(line => {
        if (y > 280) {
          addFooter(page);
          pdf.addPage();
          page++;
          addHeader();
          y = 30;
        }
        pdf.text(line, 14, y);
        y += 5.5;
      });
      y += 6;
    });

    addFooter(page);
    pdf.save("Smart_Inventory_CRUD_NLP_Report.pdf");
  };

  /* ──────────────────────────── SECTION ICON ──────────────────────────── */
  const getSectionStyle = (title) => {
    const t = title.toLowerCase();
    if (t.includes("risk") || t.includes("critical") || t.includes("dead"))
      return { bg: "bg-rose-50 border-rose-100", header: "text-rose-700", icon: AlertTriangle, iconColor: "text-rose-500" };
    if (t.includes("health") || t.includes("recommendation") || t.includes("fast"))
      return { bg: "bg-emerald-50 border-emerald-100", header: "text-emerald-700", icon: CheckCircle2, iconColor: "text-emerald-500" };
    if (t.includes("executive") || t.includes("summary"))
      return { bg: "bg-indigo-50 border-indigo-100", header: "text-indigo-700", icon: BarChart2, iconColor: "text-indigo-500" };
    return { bg: "bg-gray-50 border-gray-100", header: "text-gray-700", icon: FileText, iconColor: "text-gray-400" };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('reports.title') || 'AI Report Generator'}</h1>
            <p className="text-gray-500 text-sm">{t('reports.subtitle') || 'Generate an intelligent inventory analysis powered by Groq LLM'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {report && (
            <>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
              >
                <Download size={15} /> {t('invoices.viewPdf') || 'Download PDF'}
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-400 transition"
              >
                <Printer size={15} /> {t('reports.print') || 'Print'}
              </button>
            </>
          )}
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-200"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> {t('reports.generating') || 'Generating...'}</>
              : <><Sparkles size={15} /> {report ? (t('reports.regenerateBtn') || "Regenerate Report") : (t('reports.generateBtn') || "Generate AI Report")}</>
            }
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded-full w-48 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-full w-72 animate-pulse" />
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
              <div className="h-4 bg-gray-200 rounded-full w-40 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-full w-full animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-full w-5/6 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-full w-4/6 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !report && !error && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6">
            <Sparkles size={36} className="text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('reports.noReport') || 'No Report Generated Yet'}</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
            {t('reports.emptyDesc') || 'Click "Generate AI Report" above to create a comprehensive, AI-powered analysis of your inventory — including health scores, dead stock identification, risk alerts, and strategic recommendations.'}
          </p>
          <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
            {[
              { icon: BarChart2, label: t('reports.execSummary') || "Executive Summary", desc: "High-level overview of your inventory health" },
              { icon: TrendingUp, label: t('reports.movementAnalysis') || "Movement Analysis", desc: "Fast & dead stock categorization" },
              { icon: CheckCircle2, label: t('reports.aiRecommendations') || "AI Recommendations", desc: "Actionable steps to optimize your inventory" }
            ].map(({ icon: Icon, label, desc }, i) => (
              <div key={i} className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                <Icon size={20} className="text-indigo-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORT */}
      {!loading && report && (
        <div id="report" className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Report Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-10 text-white">
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-2">Smart Inventory Crud Web Application With NLP — AI Intelligence Report</p>
            <h2 className="text-3xl font-bold mb-2">{t('reports.reportTitle') || 'Inventory Analysis Report'}</h2>
            <p className="text-indigo-200 text-sm">
              {t('reports.generatedOn') || 'Generated on'} {new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
            </p>
          </div>

          {/* Visual Dashboard Summary */}
          {report?.data && (
            <div className="p-8 border-b border-gray-100 bg-gray-50/50 space-y-8 font-sans">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <BarChart2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{lt.dashboardTitle}</h3>
                  <p className="text-xs text-gray-500">{t('reports.subtitle')}</p>
                </div>
              </div>

              {/* Grid 1: Health Circular Gauge & KPI cards */}
              <div className="grid lg:grid-cols-12 gap-6">
                
                {/* Health Circular Gauge */}
                <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 flex flex-col items-center justify-center relative shadow-sm hover:shadow-md transition duration-300">
                  <span className="text-sm font-bold text-gray-700 mb-4 text-center">{lt.healthScore}</span>
                  
                  <div className="relative flex items-center justify-center mb-4">
                    <svg className="w-36 h-36 transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="55"
                        className="stroke-gray-100"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="55"
                        className={`transition-all duration-1000 ease-out ${
                          healthScore >= 80 ? "stroke-emerald-500" :
                          healthScore >= 60 ? "stroke-indigo-500" :
                          healthScore >= 40 ? "stroke-amber-500" :
                          "stroke-rose-500"
                        }`}
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray="345.5"
                        strokeDashoffset={345.5 - (345.5 * healthScore) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-4xl font-extrabold text-gray-800">{healthScore}</span>
                      <span className="text-[10px] uppercase font-bold text-gray-400">/ 100</span>
                    </div>
                  </div>

                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                    healthScore >= 80 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                    healthScore >= 60 ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                    healthScore >= 40 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                    "bg-rose-50 text-rose-600 border border-rose-100"
                  }`}>
                    {healthScore >= 80 ? lt.excellent :
                     healthScore >= 60 ? lt.good :
                     healthScore >= 40 ? lt.needsAttention :
                     lt.critical}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-3 text-center px-4 leading-normal">{lt.healthDesc}</p>
                </div>

                {/* Grid 2: KPI Metrics Cards */}
                <div className="lg:col-span-8 grid md:grid-cols-2 gap-4">
                  {[
                    {
                      label: lt.totalValue,
                      value: formatCurrency(totalValue),
                      icon: TrendingUp,
                      color: "from-emerald-500 to-teal-600",
                      bg: "bg-emerald-50/40 text-emerald-600",
                      shadow: "shadow-emerald-100"
                    },
                    {
                      label: lt.totalProducts,
                      value: totalProducts,
                      icon: BarChart2,
                      color: "from-indigo-500 to-purple-600",
                      bg: "bg-indigo-50/40 text-indigo-600",
                      shadow: "shadow-indigo-100"
                    },
                    {
                      label: lt.lowStock,
                      value: lowStockCount,
                      icon: AlertTriangle,
                      color: "from-amber-500 to-orange-600",
                      bg: "bg-amber-50/40 text-amber-600",
                      shadow: "shadow-amber-100",
                      alert: lowStockCount > 0
                    },
                    {
                      label: lt.deadStock,
                      value: deadStockCount,
                      icon: AlertTriangle,
                      color: "from-rose-500 to-pink-600",
                      bg: "bg-rose-50/40 text-rose-600",
                      shadow: "shadow-rose-100",
                      alert: deadStockCount > 0
                    }
                  ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <div 
                        key={i} 
                        className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-md transition duration-300 relative overflow-hidden"
                      >
                        <div className="space-y-1 relative z-10">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.label}</span>
                          <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                          {card.alert && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 animate-pulse mt-2">
                              Action Required
                            </span>
                          )}
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.bg}`}>
                          <Icon size={20} />
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Grid 2: Fast-Moving & Risk Tables */}
              <div className="grid lg:grid-cols-2 gap-6">
                
                {/* Top Fast Moving Products */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-indigo-500" size={18} />
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">{lt.fastMovingTitle}</h4>
                      <p className="text-[11px] text-gray-400">{lt.fastMovingDesc}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {report?.data?.fastMoving?.length > 0 ? (
                      report.data.fastMoving.map((p, idx) => {
                        const maxMovement = Math.max(...report.data.fastMoving.map(item => item.movement)) || 1;
                        const pct = (p.movement / maxMovement) * 100;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-700">{p.name}</span>
                              <span className="font-semibold text-indigo-600">{p.movement} units sold</span>
                            </div>
                            <div className="w-full bg-gray-50 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-400 py-4 text-center">No fast-moving items recorded.</p>
                    )}
                  </div>
                </div>

                {/* Risk Areas Overview */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="text-rose-500" size={18} />
                    <h4 className="text-sm font-bold text-gray-800">{lt.riskOverview}</h4>
                  </div>
                  
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
                    {/* Low Stock Items */}
                    {report?.data?.lowStockProducts?.map((p, idx) => (
                      <div key={`low-${idx}`} className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 border border-amber-100/60 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          <span className="font-bold text-gray-800">{p.name}</span>
                        </div>
                        <span className="text-amber-700 font-semibold">{lt.quantity}: <strong className="text-rose-600">{p.quantity}</strong> / {lt.minLevel}: {p.min}</span>
                      </div>
                    ))}

                    {/* Dead Stock Items */}
                    {report?.data?.deadStock?.map((p, idx) => (
                      <div key={`dead-${idx}`} className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/40 border border-rose-100/60 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-rose-500" />
                          <span className="font-bold text-gray-800">{p.name}</span>
                        </div>
                        <span className="text-rose-700 font-semibold">{lt.quantity}: <strong className="text-rose-600">{p.quantity}</strong></span>
                      </div>
                    ))}

                    {(!report?.data?.lowStockProducts?.length && !report?.data?.deadStock?.length) && (
                      <div className="text-center py-8 text-xs text-gray-400 flex flex-col items-center justify-center h-full">
                        <CheckCircle2 className="text-emerald-500 mb-2" size={24} />
                        <p>{lt.noRisks}</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Sections */}
          <div className="p-8 space-y-5">
            {formattedSections.length === 0 && (
              <div className="p-5 bg-gray-50 rounded-2xl text-sm text-gray-600 whitespace-pre-wrap">
                {report.report}
              </div>
            )}
            {formattedSections.map((section, index) => {
              const style = getSectionStyle(section.title);
              const Icon = style.icon;
              return (
                <div key={index} className={`p-6 rounded-2xl border ${style.bg}`}>
                  <div className={`flex items-center gap-2 font-bold text-base mb-4 ${style.header}`}>
                    <Icon size={18} className={style.iconColor} />
                    {section.title}
                  </div>
                  <div className="text-sm text-gray-700 space-y-2 leading-relaxed">
                    {section.content
                      .split("\n")
                      .filter(line => line.trim())
                      .map((line, i) => {
                        const trimmed = line.trim();
                        if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
                          return (
                            <div key={i} className="flex gap-2.5">
                              <span className="text-indigo-400 mt-0.5">•</span>
                              <span>{trimmed.replace(/^[\*\-]\s*/, "")}</span>
                            </div>
                          );
                        }
                        return <p key={i}>{trimmed}</p>;
                      })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Report Footer */}
          <div className="border-t border-gray-100 px-8 py-5 flex justify-between items-center bg-gray-50 rounded-b-3xl">
            <p className="text-xs text-gray-400">© 2026 Smart Inventory CRUD Web Application With NLP</p>
            <p className="text-xs text-gray-400">Powered by Groq LLM · {report.data?.summary?.totalProducts ?? 0} products analyzed</p>
          </div>

        </div>
      )}

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report, #report * { visibility: visible; }
          #report { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

    </div>
  );
}