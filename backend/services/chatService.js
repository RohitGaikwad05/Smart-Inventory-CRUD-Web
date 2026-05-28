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

async function dbProductExists(name, brand = "Generic") {
  if (!name) return false;
  const search = name.toLowerCase().trim();
  const targetBrand = (brand || "Generic").toLowerCase().trim();
  const count = await Product.countDocuments({
    name: { $regex: new RegExp(`^${search}$`, "i") },
    brand: { $regex: new RegExp(`^${targetBrand}$`, "i") }
  });
  return count > 0;
}

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
You are an AI inventory assistant for Smart Inventory CRUD Web Application With NLP.
The user may provide commands in ANY language (English, Hindi, Marathi, etc.).
Convert user messages into JSON commands. Translate all intent and product names to English.

Identify if a brand name is spoken or written. The brand may be in various formats such as:
- "[Brand] [Product]" (e.g. "Dell laptops")
- "[Product] of [Brand]" (e.g. "laptops of Dell", "books of science")
- "[Brand] brand [Product]" (e.g. "Dell brand laptops")
- Hindi/Marathi possessive forms (e.g., "Dell ke laptops", "Dell che laptops", "डेल्सचे लॅपटॉप").
Isolate the brand (e.g., 'Dell', 'HP', 'Apple', 'Samsung') and store it in the "brand" key. If no specific brand is mentioned, return "Generic".

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

User: add 10 Dell laptops
{"action":"add_stock","product_name":"laptop","brand":"Dell","quantity":10}

User: add 100 books for 2000
{"action":"add_stock","product_name":"books","brand":"Generic","quantity":100,"price":2000}

User: remove 5 chairs
{"action":"remove_stock","product_name":"chairs","brand":"Generic","quantity":5}

User: create product Apple phone with price 50000
{"action":"create_product","product_name":"phone","brand":"Apple","price":50000}

User: create product monitor with 50 units at 15000
{"action":"create_product","product_name":"monitor","brand":"Generic","quantity":50,"price":15000}

User: update laptop price to 55000
{"action":"update_product","product_name":"laptop","price":55000}

User: set minimum stock level for gpu to 10
{"action":"update_product","product_name":"gpu","minStockLevel":10}

User: delete product old keyboard
{"action":"delete_product","product_name":"old keyboard","brand":"Generic"}

User: how many HP laptops do I have
{"action":"view_product","product_name":"laptop","brand":"HP"}

User: what is the price of gpu
{"action":"view_product","product_name":"gpu","brand":"Generic"}

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

async function checkIncompleteAndAsk(intent, sessionId) {
  if (!intent || !intent.action) return null;

  const action = intent.action;

  // Clean undefined/null string representations
  if (intent.product_name === "undefined" || intent.product_name === "null") {
    intent.product_name = "";
  }

  // Define product name placeholders to avoid treating generic placeholders as actual names
  const PLACEHOLDERS = ["product", "products", "item", "items", "generic", "stock", "inventory", "brand", "something", "anything"];

  if (action === "create_product") {
    const isPlaceholderName = !intent.product_name || PLACEHOLDERS.includes(intent.product_name.toLowerCase().trim());
    
    if (isPlaceholderName) {
      setSessionState(sessionId, { action: "create_product", step: "product_name", price: intent.price, quantity: intent.quantity });
      return {
        type: "conversation",
        response: "What is the name of the new product?"
      };
    }
    
    if (!intent.brand || intent.brand === "Generic" || PLACEHOLDERS.includes(intent.brand.toLowerCase().trim())) {
      setSessionState(sessionId, { action: "create_product", step: "brand", product_name: intent.product_name, price: intent.price, quantity: intent.quantity });
      return {
        type: "conversation",
        response: `What is the brand of "${intent.product_name}"? (Type the brand name, or "Generic" if none)`
      };
    }

    if (!intent.price || isNaN(intent.price)) {
      setSessionState(sessionId, { action: "create_product", step: "price", product_name: intent.product_name, brand: intent.brand, quantity: intent.quantity });
      const brandStr = intent.brand && intent.brand !== "Generic" ? `${intent.brand} ` : "";
      return {
        type: "conversation",
        response: `What is the price of the new product "${brandStr}${intent.product_name}"?`
      };
    }

    if (intent.quantity === undefined || isNaN(intent.quantity)) {
      setSessionState(sessionId, { action: "create_product", step: "quantity", product_name: intent.product_name, brand: intent.brand, price: intent.price });
      const brandStr = intent.brand && intent.brand !== "Generic" ? `${intent.brand} ` : "";
      return {
        type: "conversation",
        response: `What is the initial stock quantity for "${brandStr}${intent.product_name}"?`
      };
    }
  }

  if (action === "add_stock" || action === "remove_stock") {
    const actWord = action === "add_stock" ? "add" : "remove";
    const isPlaceholderName = !intent.product_name || PLACEHOLDERS.includes(intent.product_name.toLowerCase().trim());

    if (isPlaceholderName) {
      setSessionState(sessionId, { action, quantity: intent.quantity, brand: intent.brand });
      return {
        type: "conversation",
        response: `Which product would you like to ${actWord} stock for?`
      };
    }

    // Solution 1: Check if product exists in database for add_stock
    if (action === "add_stock") {
      const exists = await dbProductExists(intent.product_name, intent.brand || "Generic");
      if (!exists) {
        if (!intent.price || isNaN(intent.price) || intent.price <= 0) {
          setSessionState(sessionId, {
            action: "create_product_during_add",
            product_name: intent.product_name,
            brand: intent.brand || "Generic",
            quantity: intent.quantity || 1
          });
          const brandStr = intent.brand && intent.brand !== "Generic" ? `${intent.brand} ` : "";
          return {
            type: "conversation",
            response: `"${brandStr}${intent.product_name}" is not in the system yet. Since I need to create it first, what is the price of this product?`
          };
        }
      }
    }

    if (!intent.quantity || isNaN(intent.quantity)) {
      setSessionState(sessionId, { action, product_name: intent.product_name, brand: intent.brand });
      return {
        type: "conversation",
        response: `How many units of "${intent.product_name}" would you like to ${actWord}?`
      };
    }
  }

  if (action === "update_product") {
    const isPlaceholderName = !intent.product_name || PLACEHOLDERS.includes(intent.product_name.toLowerCase().trim());

    if (isPlaceholderName) {
      setSessionState(sessionId, { action: "update_product", price: intent.price, minStockLevel: intent.minStockLevel, quantity: intent.quantity });
      return {
        type: "conversation",
        response: "Which product would you like to update?"
      };
    }
    if (!intent.price && !intent.minStockLevel && intent.quantity === undefined) {
      setSessionState(sessionId, { action: "update_product", product_name: intent.product_name, brand: intent.brand });
      return {
        type: "conversation",
        response: `What details would you like to update for "${intent.product_name}"? (e.g., price, quantity, or minimum stock level)`
      };
    }
  }

  if (action === "delete_product") {
    const isPlaceholderName = !intent.product_name || PLACEHOLDERS.includes(intent.product_name.toLowerCase().trim());

    if (isPlaceholderName) {
      setSessionState(sessionId, { action: "delete_product" });
      return {
        type: "conversation",
        response: "Which product would you like to delete?"
      };
    }
  }

  if (action === "view_product") {
    const isPlaceholderName = !intent.product_name || PLACEHOLDERS.includes(intent.product_name.toLowerCase().trim());

    if (isPlaceholderName) {
      setSessionState(sessionId, { action: "view_product" });
      return {
        type: "conversation",
        response: "Which product details would you like to view?"
      };
    }
  }

  return null;
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
`👋 Hello! I'm **Smart Inventory Crud Web Application With NLP AI**, your intelligent inventory assistant.

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
    if (state.action === "create_product_during_add") {
      const price = parseFloat(message.match(/\d+(\.\d+)?/)?.[0] || message);
      if (isNaN(price) || price <= 0) {
        return {
          type: "conversation",
          response: "Please enter a valid price greater than zero."
        };
      }
      clearSessionState(sessionId);
      return {
        type: "command",
        action: "create_product",
        product_name: state.product_name,
        brand: state.brand || "Generic",
        price,
        quantity: state.quantity || 1
      };
    }

    if (state.action === "create_product") {
      // Step 1: Product Name
      if (state.step === "product_name" || !state.product_name) {
        if (looksLikeSentence(message)) {
          return {
            type: "conversation",
            response: "That doesn't look like a product name. Please enter a simple product name."
          };
        }
        state.product_name = message.trim();
        state.step = "brand";
        setSessionState(sessionId, state);
        return {
          type: "conversation",
          response: `What is the brand of "${state.product_name}"? (Type the brand name, or "Generic" if none)`
        };
      }

      // Step 2: Brand Name
      if (state.step === "brand" || !state.brand) {
        state.brand = message.trim();
        state.step = "price";
        setSessionState(sessionId, state);
        const brandStr = state.brand && state.brand !== "Generic" ? `${state.brand} ` : "";
        return {
          type: "conversation",
          response: `What is the price of the new product "${brandStr}${state.product_name}"?`
        };
      }

      // Step 3: Price
      if (state.step === "price" || !state.price) {
        const price = parseFloat(message.match(/\d+(\.\d+)?/)?.[0] || message);
        if (isNaN(price)) {
          return {
            type: "conversation",
            response: "Please enter a valid numeric price."
          };
        }
        state.price = price;
        state.step = "quantity";
        setSessionState(sessionId, state);
        const brandStr = state.brand && state.brand !== "Generic" ? `${state.brand} ` : "";
        return {
          type: "conversation",
          response: `What is the initial stock quantity for "${brandStr}${state.product_name}"?`
        };
      }

      // Step 4: Quantity
      if (state.step === "quantity" || state.quantity === undefined) {
        const quantity = parseInt(message.match(/\d+/)?.[0] || message);
        if (isNaN(quantity)) {
          return {
            type: "conversation",
            response: "Please enter a valid numeric quantity."
          };
        }
        clearSessionState(sessionId);
        return {
          type: "command",
          action: "create_product",
          product_name: state.product_name,
          brand: state.brand || "Generic",
          price: state.price,
          quantity
        };
      }
    }

    if (state.action === "add_stock" || state.action === "remove_stock") {
      const actWord = state.action === "add_stock" ? "add" : "remove";
      if (!state.product_name) {
        state.product_name = message.trim();
        if (!state.quantity) {
          setSessionState(sessionId, state);
          return {
            type: "conversation",
            response: `How many units of "${state.product_name}" would you like to ${actWord}?`
          };
        }
      } else if (!state.quantity) {
        const quantity = parseInt(message.match(/\d+/)?.[0] || message);
        if (isNaN(quantity)) {
          return {
            type: "conversation",
            response: "Please enter a valid numeric quantity."
          };
        }
        state.quantity = quantity;
      }

      clearSessionState(sessionId);
      return {
        type: "command",
        action: state.action,
        product_name: state.product_name,
        brand: state.brand || "Generic",
        quantity: Number(state.quantity)
      };
    }

    if (state.action === "update_product") {
      if (!state.product_name) {
        state.product_name = message.trim();
        if (!state.price && !state.minStockLevel && state.quantity === undefined) {
          setSessionState(sessionId, state);
          return {
            type: "conversation",
            response: `What details would you like to update for "${state.product_name}"? (e.g., price, quantity, or minimum stock level)`
          };
        }
      } else if (!state.price && !state.minStockLevel && state.quantity === undefined) {
        const num = parseFloat(message.match(/\d+(\.\d+)?/)?.[0]);
        if (isNaN(num)) {
          return {
            type: "conversation",
            response: "Please specify a numeric value for the update (e.g., 'price 500', 'quantity 100', or 'min stock 10')."
          };
        }
        
        const lowerMessage = message.toLowerCase();
        
        // 1. Check for min stock level
        if ((lowerMessage.includes("stock") || lowerMessage.includes("level") || lowerMessage.includes("min") || lowerMessage.includes("minimum")) && 
            (lowerMessage.includes("min") || lowerMessage.includes("minimum") || lowerMessage.includes("alert") || lowerMessage.includes("level"))) {
          clearSessionState(sessionId);
          return {
            type: "command",
            action: "update_product",
            product_name: state.product_name,
            minStockLevel: num
          };
        }
        
        // 2. Check for quantity
        if (lowerMessage.includes("quantity") || lowerMessage.includes("qty") || lowerMessage.includes("stock") || lowerMessage.includes("units") || lowerMessage.includes("count")) {
          clearSessionState(sessionId);
          return {
            type: "command",
            action: "update_product",
            product_name: state.product_name,
            quantity: num
          };
        }
        
        // 3. Check for price
        if (lowerMessage.includes("price") || lowerMessage.includes("rate") || lowerMessage.includes("cost") || lowerMessage.includes("rupees") || lowerMessage.includes("rs") || lowerMessage.includes("₹")) {
          clearSessionState(sessionId);
          return {
            type: "command",
            action: "update_product",
            product_name: state.product_name,
            price: num
          };
        }
        
        // Clarification instead of guess:
        return {
          type: "conversation",
          response: `I found the number ${num}. Please specify what this number is for: "price ${num}", "quantity ${num}", or "min stock ${num}"?`
        };
      }

      clearSessionState(sessionId);
      return {
        type: "command",
        action: "update_product",
        product_name: state.product_name,
        price: state.price,
        quantity: state.quantity,
        minStockLevel: state.minStockLevel
      };
    }

    if (state.action === "delete_product") {
      clearSessionState(sessionId);
      return {
        type: "command",
        action: "delete_product",
        product_name: message.trim()
      };
    }

    if (state.action === "view_product") {
      clearSessionState(sessionId);
      return {
        type: "command",
        action: "view_product",
        product_name: message.trim()
      };
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

  const incompletePrompt = await checkIncompleteAndAsk(intent, sessionId);
  if (incompletePrompt) {
    return incompletePrompt;
  }

  return {
    type:"command",
    ...intent
  };

};

async function translateResponse(text, lang) {
  if (!text || !lang || lang === "en" || !["mr", "hi", "ta", "pa", "gu"].includes(lang)) {
    return text;
  }
  
  const targetLanguage = lang === "mr" ? "Marathi (मराठी)" : (lang === "hi" ? "Hindi (हिंदी)" : (lang === "ta" ? "Tamil (தமிழ்)" : (lang === "pa" ? "Punjabi (ਪੰਜਾਬੀ)" : (lang === "gu" ? "Gujarati (ગુજરાતી)" : "English"))));
  const systemPrompt = `You are a professional business translator. Translate the following business inventory status message or chat response to ${targetLanguage}. Keep any formatted numbers, currency symbols (₹), emoji symbols, product names, and Markdown markers (**bold**) exactly as they are. Return ONLY the translated text without any explanation or conversational preamble.`;
  
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0.2
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}

exports.clearContext = (sessionId="default") => {
  clearSessionState(sessionId);
};

exports.translateResponse = translateResponse;