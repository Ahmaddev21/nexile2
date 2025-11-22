import { GoogleGenAI } from "@google/genai";
import { Product, Transaction } from '../types';

// Initialize Gemini
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
// Assume this variable is pre-configured, valid, and accessible in the execution context.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      .map(p => `${p.name} (${p.stock})`);
      
    const recentSales = transactions
      .slice(0, 10) // Limit to last 10 transactions
      .map(t => `${t.totalAmount}`)
      .join(', ');
      
    const categories = Array.from(new Set(products.map(p => p.category))).slice(0, 10).join(', ');

    const prompt = `
      You are the "Pharmacy Intelligence Engine" for Nexile.
      Analyze this snapshot:
      - Critical Items: ${lowStock.length > 0 ? lowStock.join(', ') : 'None'}
      - Recent Sale Values: ${recentSales}
      
      Generate a specific, predictive insight in one of these formats (choose most relevant):
      1. Stock Depletion: "[Product] will run out in [X] days at current rate."
      2. Demand Surge: "Unusual demand detected for [Category]."
      3. Profit Optimization: "Suggest restocking [Product] due to high margin/velocity."
      
      Keep it under 25 words. Be professional and predictive. Do not use markdown.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Intelligence Engine: Monitor fast-moving stock levels for optimization.";
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "Intelligence Engine: Network optimization in progress.";
  }
};