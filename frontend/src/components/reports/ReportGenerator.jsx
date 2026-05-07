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

export default function ReportGenerator() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ──────────────────────────── GENERATE ──────────────────────────── */
  const generateReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/reports/generate");
      setReport(res.data);
    } catch (err) {
      setError("Failed to generate report. Please ensure the backend is running and Groq API key is configured.");
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
      pdf.text("Kognio", 14, 12);
      pdf.setFontSize(9);
      pdf.setFont(undefined, "normal");
      pdf.text("Inventory, Powered by Intelligence", 14, 17.5);
      pdf.setFontSize(9);
      pdf.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 150, 12);
    };

    const addFooter = (pg) => {
      pdf.setFontSize(9);
      pdf.setTextColor(150);
      pdf.text(`Kognio AI Report — Page ${pg}`, 14, 292);
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
    pdf.save("Kognio_AI_Report.pdf");
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
            <h1 className="text-2xl font-bold text-gray-800">AI Report Generator</h1>
            <p className="text-gray-500 text-sm">Generate an intelligent inventory analysis powered by Groq LLM</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {report && (
            <>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
              >
                <Download size={15} /> Download PDF
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-400 transition"
              >
                <Printer size={15} /> Print
              </button>
            </>
          )}
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-200"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Generating...</>
              : <><Sparkles size={15} /> {report ? "Regenerate Report" : "Generate AI Report"}</>
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
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Report Generated Yet</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
            Click <strong>"Generate AI Report"</strong> above to create a comprehensive, AI-powered analysis of your inventory — including health scores, dead stock identification, risk alerts, and strategic recommendations.
          </p>
          <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
            {[
              { icon: BarChart2, label: "Executive Summary", desc: "High-level overview of your inventory health" },
              { icon: TrendingUp, label: "Movement Analysis", desc: "Fast & dead stock categorization" },
              { icon: CheckCircle2, label: "AI Recommendations", desc: "Actionable steps to optimize your inventory" }
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
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-2">Kognio — AI Intelligence Report</p>
            <h2 className="text-3xl font-bold mb-2">Inventory Analysis Report</h2>
            <p className="text-indigo-200 text-sm">
              Generated on {new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
            </p>
          </div>

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
            <p className="text-xs text-gray-400">© 2026 Kognio AI — Inventory, Powered by Intelligence</p>
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