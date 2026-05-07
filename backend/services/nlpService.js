const Groq = require('groq-sdk');
const Product = require('../models/Product');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const systemPrompt = `You are an inventory management assistant for Kognio. The user may provide commands in ANY language (e.g., English, Hindi, Marathi, Spanish).
Extract information from the user commands, translate the intent and product names to English, and return ONLY a JSON object with no extra text.

Actions: add_stock, remove_stock, view_product, list_products, create_product, update_product, delete_product, low_stock, inventory_value, dead_stock, overstock

Return format (MUST ALWAYS BE IN ENGLISH):
{
  "action": "action_name",
  "product_name": "string (in English, if applicable)",
  "quantity": number (if applicable),
  "price": number (if applicable),
  "category": "string (if applicable)",
  "minStockLevel": number (if applicable)
}

Examples:
"Add 50 laptops" -> {"action":"add_stock","product_name":"laptops","quantity":50}
"Remove 10 chairs" -> {"action":"remove_stock","product_name":"chairs","quantity":10}
"Show me laptop details" -> {"action":"view_product","product_name":"laptop"}
"List all products" -> {"action":"list_products"}
"Create product phone with price 500" -> {"action":"create_product","product_name":"phone","price":500}
"Create 10 monitors at 15000" -> {"action":"create_product","product_name":"monitor","quantity":10,"price":15000}
"Update laptop price to 55000" -> {"action":"update_product","product_name":"laptop","price":55000}
"Set minimum stock for gpu to 10" -> {"action":"update_product","product_name":"gpu","minStockLevel":10}
"Delete product old keyboard" -> {"action":"delete_product","product_name":"old keyboard"}
"Show low stock items" -> {"action":"low_stock"}
"What is my inventory value" -> {"action":"inventory_value"}
"Show dead stock" -> {"action":"dead_stock"}
"Which products are overstocked" -> {"action":"overstock"}`;

const findBestMatchProduct = async (searchName) => {
  if (!searchName) return null;
  
  const products = await Product.find();
  if (products.length === 0) return null;

  const search = searchName.toLowerCase().trim();
  
  // Exact match
  let match = products.find(p => p.name.toLowerCase() === search);
  if (match) return match;
  
  // Partial match (contains)
  match = products.find(p => p.name.toLowerCase().includes(search) || search.includes(p.name.toLowerCase()));
  if (match) return match;
  
  // Fuzzy match (similar)
  const similarities = products.map(p => ({
    product: p,
    score: calculateSimilarity(search, p.name.toLowerCase())
  }));
  
  similarities.sort((a, b) => b.score - a.score);
  
  if (similarities[0].score > 0.5) {
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
      model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: command }
      ],
      temperature: 0.3
    });

    const intent = JSON.parse(response.choices[0].message.content);
    
    // Auto-detect and match product name
    if (intent.product_name) {
      const matchedProduct = await findBestMatchProduct(intent.product_name);
      if (matchedProduct) {
        intent.matched_product = matchedProduct;
        intent.original_name = intent.product_name;
        intent.product_name = matchedProduct.name;
      }
    }
    
    return intent;
  } catch (error) {
    console.error('NLP Error:', error);
    throw new Error('Failed to process command');
  }
};

exports.findBestMatchProduct = findBestMatchProduct;
