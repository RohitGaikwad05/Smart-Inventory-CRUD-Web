const Groq = require('groq-sdk');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.generateReport = async (lang = 'en') => {
  try {

    const products = await Product.find();
    const transactions = await Transaction.find().sort('-createdAt');

    if (products.length === 0) {
      return {
        report: lang === 'mr' ? "इन्व्हेंटरी डेटा उपलब्ध नाही." : (lang === 'hi' ? "इन्वेंटरी डेटा उपलब्ध नहीं है।" : "No inventory data available."),
        data: {},
        generatedAt: new Date()
      };
    }

    /* BASIC STATS */

    const totalProducts = products.length;

    const totalValue = products.reduce(
      (sum,p)=>sum + p.quantity * p.price,0
    );

    const lowStock = products.filter(
      p => p.quantity <= p.minStockLevel
    );

    const outOfStock = products.filter(
      p => p.quantity === 0
    );

    /* DEAD STOCK (no movement in 30 days) */

    const last30Days = new Date(
      Date.now() - 30*24*60*60*1000
    );

    const recentTransactions = transactions.filter(
      t => new Date(t.createdAt) > last30Days
    );

    const movedProductIds = new Set(
      recentTransactions.map(t=>String(t.product))
    );

    const deadStock = products.filter(
      p => !movedProductIds.has(String(p._id))
    );

    /* FAST MOVING PRODUCTS */

    const productMovement = {};

    recentTransactions.forEach(t=>{
      const id = String(t.product);
      if(!productMovement[id]) productMovement[id] = 0;
      productMovement[id] += t.quantity;
    });

    const fastMoving = products
      .map(p=>({
        name:p.name,
        movement:productMovement[String(p._id)] || 0
      }))
      .sort((a,b)=>b.movement-a.movement)
      .slice(0,5);

    /* OVERSTOCK */

    const overStock = products.filter(
      p => p.quantity > p.minStockLevel * 5
    );

    /* REPORT DATA */

    const reportData = {

      summary:{
        totalProducts,
        totalValue,
        lowStockCount:lowStock.length,
        outOfStockCount:outOfStock.length,
        deadStockCount:deadStock.length
      },

      fastMoving,

      deadStock:deadStock.map(p=>({
        name:p.name,
        quantity:p.quantity
      })),

      overStock:overStock.map(p=>({
        name:p.name,
        quantity:p.quantity
      })),

      lowStockProducts:lowStock.map(p=>({
        name:p.name,
        quantity:p.quantity,
        min:p.minStockLevel
      }))

    };

    /* AI REPORT PROMPT */

    let languageInstruction = "";
    if (lang === "mr") {
      languageInstruction = "CRITICAL REQUIREMENT: You MUST write the ENTIRE report in MARATHI (मराठी). All section titles and content must be in Marathi language only. Translate terms like 'Executive Summary' to 'कार्यकारी सारांश', 'Inventory Health Score' to 'इन्व्हेंटरी आरोग्य स्कोअर', etc.";
    } else if (lang === "hi") {
      languageInstruction = "CRITICAL REQUIREMENT: You MUST write the ENTIRE report in HINDI (हिंदी). All section titles and content must be in Hindi language only. Translate terms like 'Executive Summary' to 'कार्यकारी सारांश', 'Inventory Health Score' to 'इन्वेंटरी हेल्थ स्कोर', etc.";
    } else if (lang === "ta") {
      languageInstruction = "CRITICAL REQUIREMENT: You MUST write the ENTIRE report in TAMIL (தமிழ்). All section titles and content must be in Tamil language only. Translate terms like 'Executive Summary' to 'நிர்வாக சுருக்கம்', 'Inventory Health Score' to 'சரக்கு ஆரோக்கிய மதிப்பெண்', etc.";
    } else if (lang === "pa") {
      languageInstruction = "CRITICAL REQUIREMENT: You MUST write the ENTIRE report in PUNJABI (ਪੰਜਾਬੀ). All section titles and content must be in Punjabi language only. Translate terms like 'Executive Summary' to 'ਕਾਰਜਕਾਰੀ ਸਾਰਾਂਸ਼', 'Inventory Health Score' to 'ਇਨਵੈਂਟਰੀ ਸਿਹਤ ਸਕੋਰ', etc.";
    } else if (lang === "gu") {
      languageInstruction = "CRITICAL REQUIREMENT: You MUST write the ENTIRE report in GUJARATI (ગુજરાતી). All section titles and content must be in Gujarati language only. Translate terms like 'Executive Summary' to 'કાર્યકારી સારાંશ', 'Inventory Health Score' to 'ઇન્વેન્ટરી હેલ્થ સ્કોર', etc.";
    } else {
      languageInstruction = "CRITICAL REQUIREMENT: You MUST write the ENTIRE report in ENGLISH.";
    }

    const prompt = `You are an expert inventory analyst generating a professional business intelligence report for an Indian SME using the Smart Inventory CRUD Web Application With NLP.

${languageInstruction}

Current Inventory Data:
${JSON.stringify(reportData, null, 2)}

Generate a comprehensive, professional report using EXACTLY this format.
Each section MUST start with **Section Title** (bold using double asterisks) followed by the content.
Do NOT use markdown headers like # or ##. Only use **bold** for section titles.

Required Sections (include all of them, fully translated to the target language):

**Executive Summary**
A concise 3-4 sentence overview of the overall inventory health, total value in INR, and most critical action points.

**Inventory Health Score**
Explain the current health score based on dead stock, low stock, and overstock levels. Rate as Excellent (80-100), Good (60-79), Needs Attention (40-59), or Critical (below 40).

**Fast Moving Products Analysis**
List and analyze the top fast-moving products. Explain what this means for procurement and cash flow.

**Dead Stock Analysis**
Identify products with no movement in the last 30 days. Quantify the capital tied up and recommend liquidation or promotion strategies.

**Low Stock Risk Assessment**
Identify products at or below minimum stock levels. Highlight the risk of stockouts and their business impact.

**Overstock Warning**
Identify products with excess inventory. Highlight storage cost and capital lock-in risks.

**Operational Risks**
List the top 3-5 specific risks in priority order. Be direct and actionable.

**Strategic Recommendations**
Provide 5 specific, numbered, actionable recommendations to improve inventory performance in the next 30 days. Use INR values where relevant.

**Future Predictions**
Based on current movement trends, predict inventory needs for the next 30 days. Identify which products will likely go out of stock and which may become dead stock.

Use INR (₹) for all currency values. Be specific, professional, and data-driven.`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 4000
    });

    return {
      report: response.choices[0].message.content,
      data: reportData,
      generatedAt: new Date()
    };

  } catch(err) {
    console.error(err);
    throw new Error("Failed to generate report");
  }
};