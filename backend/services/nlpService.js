const Groq = require('groq-sdk');
const Product = require('../models/Product');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const systemPrompt = `You are an inventory management assistant for the Smart Inventory CRUD Web Application With NLP. The user may provide commands in ANY language (e.g., English, Hindi, Marathi, Spanish).
Extract information from the user commands, translate the intent and product names to English, and return ONLY a JSON object with no extra text.

Identify if a brand name is spoken or written. The brand may be in various formats such as:
- "[Brand] [Product]" (e.g. "Dell laptops")
- "[Product] of [Brand]" (e.g. "laptops of Dell")
- "[Brand] brand [Product]" (e.g. "Dell brand laptops")
- Hindi/Marathi possessive forms (e.g., "Dell ke laptops", "Dell che laptops", "डेल्सचे लॅपटॉप").
Isolate the brand (e.g., 'Dell', 'HP', 'Apple', 'Samsung') and store it in "brand". If no specific brand is mentioned, return "Generic".

Actions: add_stock, remove_stock, view_product, list_products, create_product, update_product, delete_product, low_stock, inventory_value, dead_stock, overstock

Return format (MUST ALWAYS BE IN ENGLISH):
{
  "action": "action_name",
  "product_name": "string (in English, if applicable)",
  "brand": "string (brand name in English, if applicable, otherwise 'Generic')",
  "quantity": number (if applicable),
  "price": number (if applicable),
  "category": "string (if applicable)",
  "minStockLevel": number (if applicable)
}

Examples:
"Add 50 Dell laptops" -> {"action":"add_stock","product_name":"laptop","brand":"Dell","quantity":50}
"Remove 10 chairs" -> {"action":"remove_stock","product_name":"chair","brand":"Generic","quantity":10}
"Show me HP laptop details" -> {"action":"view_product","product_name":"laptop","brand":"HP"}
"List all products" -> {"action":"list_products"}
"Create product Apple phone with price 500" -> {"action":"create_product","product_name":"phone","brand":"Apple","price":500}
"Create 10 Adidas monitors at 15000" -> {"action":"create_product","product_name":"monitor","brand":"Adidas","quantity":10,"price":15000}
"Update Samsung laptop price to 55000" -> {"action":"update_product","product_name":"laptop","brand":"Samsung","price":55000}
"Set minimum stock for Parker gpu to 10" -> {"action":"update_product","product_name":"gpu","brand":"Parker","minStockLevel":10}
"Delete product old keyboard" -> {"action":"delete_product","product_name":"old keyboard","brand":"Generic"}
"Show low stock items" -> {"action":"low_stock"}
"What is my inventory value" -> {"action":"inventory_value"}
"Show dead stock" -> {"action":"dead_stock"}
"Which products are overstocked" -> {"action":"overstock"}`;

const findBestMatchProduct = async (searchName, searchBrand = "Generic") => {
  if (!searchName) return null;
  
  const products = await Product.find();
  if (products.length === 0) return null;

  const search = searchName.toLowerCase().trim();
  const brand = (searchBrand || "Generic").toLowerCase().trim();
  
  // 1. Exact match on both name and brand
  let match = products.find(p => p.name.toLowerCase() === search && p.brand.toLowerCase() === brand);
  if (match) return match;
  


  // 3. Partial match on name with matching brand
  match = products.find(p => 
    (p.name.toLowerCase().includes(search) || search.includes(p.name.toLowerCase())) &&
    (p.brand.toLowerCase() === brand)
  );
  if (match) return match;

  // 4. Fuzzy match
  const similarities = products.map(p => {
    const nameScore = calculateSimilarity(search, p.name.toLowerCase());
    const brandScore = brand === "generic" ? 1.0 : calculateSimilarity(brand, p.brand.toLowerCase());
    
    // If user asked for a specific brand, but candidate is Generic or brand similarity is too low, reject match
    if (brand !== "generic" && (p.brand.toLowerCase() === "generic" || brandScore < 0.7)) {
      return { product: p, score: 0 };
    }
    
    return {
      product: p,
      score: (nameScore * 0.7) + (brandScore * 0.3)
    };
  });
  
  similarities.sort((a, b) => b.score - a.score);
  
  if (similarities[0] && similarities[0].score > 0.5) {
    return similarities[0].product;
  }
  
  return null;
};

const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

exports.processCommand = async (command) => {
  try {
    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: command }
      ],
      temperature: 0.3
    });

    let content = response.choices[0].message.content.trim();
    if (content.includes("```")) {
      content = content.replace(/```json|```/g, "").trim();
    }

    const intent = JSON.parse(content);
    
    // Auto-detect and match product name
    if (intent.product_name) {
      const matchedProduct = await findBestMatchProduct(intent.product_name, intent.brand || "Generic");
      if (matchedProduct) {
        intent.matched_product = matchedProduct;
        intent.original_name = intent.product_name;
        intent.product_name = matchedProduct.name;
        intent.brand = matchedProduct.brand;
      }
    }
    
    return intent;
  } catch (error) {
    console.error('NLP Error:', error);
    throw new Error('Failed to process command');
  }
};

exports.findBestMatchProduct = findBestMatchProduct;
