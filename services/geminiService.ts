import { GoogleGenAI } from "@google/genai";
import { Product, Transaction } from '../types';

// Initialize Gemini
// NOTE: In a real environment, this key comes from env vars. 
// The prompt instructs to assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateBusinessInsights = async (
  products: Product[], 
  transactions: Transaction[]
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Prepare context data (summarized to save tokens)
    // Fix: Slice arrays to prevent excessive token usage
    const lowStock = products
      .filter(p => p.stock <= p.minStockLevel)
      .slice(0, 20) // Limit to top 20 critical items
      .map(p => p.name);
      
    const recentSales = transactions
      .slice(0, 10) // Limit to last 10 transactions
      .map(t => `${t.totalAmount}`)
      .join(', ');
      
    const categories = Array.from(new Set(products.map(p => p.category))).slice(0, 10).join(', ');

    const prompt = `
      You are an AI business analyst for a pharmacy named Nexile.
      Analyze the following brief snapshot of data:
      - Top Categories: ${categories}
      - Critical Items needing restock (max 20 listed): ${lowStock.length > 0 ? lowStock.join(', ') : 'None'}
      - Recent transaction values: ${recentSales}
      
      Provide a concise, professional, 2-sentence insight or actionable advice for the pharmacy manager to improve efficiency or sales.
      Focus on inventory optimization or sales trends. Do not use markdown formatting.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Review your inventory levels to ensure optimal performance.";
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "AI insights are currently unavailable. Please check network connection.";
  }
};