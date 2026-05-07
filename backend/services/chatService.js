const Groq = require("groq-sdk");
const Product = require("../models/Product");
const {
  getSessionState,
  setSessionState,
  clearSessionState
} = require("./sessionStateService");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* =====================================
GLOBAL CONSTANTS
===================================== */

const CANCEL_WORDS = [
  "cancel",
  "stop",
  "never mind",
  "leave it",
  "don't do",
  "dont do",
  "abort"
];

const CONNECTORS = /\band\b|,|&|\bthen\b|और|और फिर|और उसके बाद/i;

/* =====================================
UTILITY FUNCTIONS
===================================== */

function isCancelCommand(text) {

  text = text.toLowerCase();

  return CANCEL_WORDS.some(w => text.includes(w));
}

function looksLikeSentence(text){

  if(!text) return false;

  if(text.length > 40) return true;

  if(text.split(" ").length > 5) return true;

  return false;
}

function validateIntent(intent){

  if(!intent) return false;

  const allowedActions = [
    "add_stock",
    "remove_stock",
    "create_product",
    "update_product",
    "delete_product",
    "list_products",
    "inventory_value",
    "view_product",
    "low_stock",
    "dead_stock",
    "overstock"
  ];

  if(!allowedActions.includes(intent.action)){
    return false;
  }

  if(intent.quantity && isNaN(intent.quantity)){
    return false;
  }

  if(intent.price && isNaN(intent.price)){
    return false;
  }

  return true;
}

/* =====================================
AI INTENT PARSER
===================================== */

async function parseIntent(message, inventorySummary) {

const systemPrompt = `
You are an AI inventory assistant for Kognio Inventory Management System.
The user may provide commands in ANY language (English, Hindi, Marathi, etc.).
Convert user messages into JSON commands. Translate all intent and product names to English.

Supported actions:
add_stock
remove_stock
create_product
update_product
delete_product
list_products
inventory_value
view_product
low_stock
dead_stock
overstock

Return ONLY valid JSON (no extra text, no markdown).

Examples:

User: add 10 laptops
{"action":"add_stock","product_name":"laptop","quantity":10}

User: add 100 books for 2000
{"action":"add_stock","product_name":"books","quantity":100,"price":2000}

User: remove 5 chairs
{"action":"remove_stock","product_name":"chairs","quantity":5}

User: create product gpu price 30000
{"action":"create_product","product_name":"gpu","price":30000}

User: create product monitor with 50 units at 15000
{"action":"create_product","product_name":"monitor","quantity":50,"price":15000}

User: update laptop price to 55000
{"action":"update_product","product_name":"laptop","price":55000}

User: set minimum stock level for gpu to 10
{"action":"update_product","product_name":"gpu","minStockLevel":10}

User: delete product old keyboard
{"action":"delete_product","product_name":"old keyboard"}

User: how many laptops do I have
{"action":"view_product","product_name":"laptop"}

User: what is the price of gpu
{"action":"view_product","product_name":"gpu"}

User: show inventory
{"action":"list_products"}

User: show low stock items
{"action":"low_stock"}

User: what's my inventory value
{"action":"inventory_value"}

User: show dead stock
{"action":"dead_stock"}

User: which products are overstocked
{"action":"overstock"}

Languages supported: English, Hindi, Marathi, Tamil, Telugu, Kannada, Gujarati, Punjabi
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: systemPrompt + "\nInventory:" + inventorySummary
      },
      {
        role: "user",
        content: message
      }
    ]
  });

  let text = response.choices[0].message.content.trim();

  if (text.includes("```")) {
    text = text.replace(/```json|```/g, "").trim();
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/* =====================================
MULTI COMMAND SPLITTER
===================================== */

function splitCommands(message) {

  const parts = message
    .toLowerCase()
    .split(CONNECTORS)
    .map(p => p.trim())
    .filter(Boolean);

  if (parts.length <= 1) return null;

  return parts;
}

/* =====================================
MAIN CHAT ENGINE
===================================== */

exports.chat = async (message, sessionId="default") => {

  message = message.trim();

  if(isCancelCommand(message)){

    clearSessionState(sessionId);

    return{
      type:"conversation",
      response:"✅ Okay, I cancelled the current task. How can I help you now?"
    }

  }

  if (/^(hi|hello|hey|namaste)/i.test(message)) {
    return {
      type: "conversation",
      response:
`👋 Hello! I'm **Kognio AI**, your intelligent inventory assistant.

Here's everything I can do for you:

📦 **Stock Management**
• "Add 50 laptops" — Add stock to a product
• "Remove 10 chairs" — Reduce stock
• "How many GPUs do I have?" — View product details

🏷️ **Product Management**
• "Create product Monitor at ₹15000" — Add a new product
• "Update laptop price to ₹55000" — Edit product details
• "Set minimum stock for GPU to 10" — Update min level
• "Delete product old keyboard" — Remove a product

📊 **Inventory Intelligence**
• "Show all products" — List full inventory
• "What's my total inventory value?" — Stock valuation
• "Show low stock items" — Products needing restock
• "Show dead stock" — Products with no movement (30 days)
• "Which products are overstocked?" — Excess inventory

💬 I also support **Hindi, Marathi, and other Indian languages!**`
    };
  }

  const state = getSessionState(sessionId);

  if (state) {

    if (state.action === "create_product") {

      if (!state.product_name) {

        if(looksLikeSentence(message)){

          return{
            type:"conversation",
            response:"That doesn't look like a product name. Please enter a simple product name."
          }

        }

        state.product_name = message.trim();
        setSessionState(sessionId, state);

        return {
          type: "conversation",
          response: "What is the price of the product?"
        };

      }

      if (!state.price) {

        const price = parseFloat(message);

        if(isNaN(price)){

          return{
            type:"conversation",
            response:"Please enter a valid numeric price."
          }

        }

        clearSessionState(sessionId);

        return {
          type: "command",
          action: "create_product",
          product_name: state.product_name,
          price
        };

      }

    }

  }

  /* =====================================
  MULTI COMMAND SUPPORT
  ===================================== */

  const parts = splitCommands(message);

  if (parts) {

    const commands = [];

    const products = await Product.find().limit(10);
    const summary = products.map(p => `${p.name}:${p.quantity}`).join(",");

    for (const p of parts) {

      const intent = await parseIntent(p, summary);

      if (validateIntent(intent)) {

        commands.push({
          type: "command",
          ...intent
        });

      }

    }

    if (commands.length >= 2) {   // ✅ FIXED
      return {
        type:"batch_command",
        commands
      };
    }

  }

  const products = await Product.find().limit(10);
  const summary = products.map(p => `${p.name}:${p.quantity}`).join(",");

  const intent = await parseIntent(message, summary);

  if (!validateIntent(intent)) {

    return {
      type:"conversation",
      response:
"Sorry, I couldn't understand that command.\n\nTry something like:\n• add 10 laptops\n• show inventory\n• show low stock items\n• create product gpu price 30000"
    };

  }

  if (intent.action === "create_product" && !intent.product_name) {

    setSessionState(sessionId,{
      action:"create_product"
    });

    return {
      type:"conversation",
      response:"What is the product name?"
    };

  }

  return {
    type:"command",
    ...intent
  };

};

exports.clearContext = (sessionId="default") => {
  clearSessionState(sessionId);
};