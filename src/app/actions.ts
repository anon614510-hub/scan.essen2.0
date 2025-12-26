"use server";

import OpenAI from "openai";
import { Ingredient, Recipe } from "@/lib/types";

export async function identifyIngredients(base64Image: string): Promise<Ingredient[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
    const openai = new OpenAI({ apiKey });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Identify all food ingredients in this fridge image. Also analyze their freshness. Return a valid JSON object with a key 'ingredients' containing an array of objects. Each object must have: name (string), expiry_status ('fresh', 'soon', 'expired'), expiry_reasoning (short string). Do not use markdown." },
                        {
                            type: "image_url",
                            image_url: {
                                url: base64Image,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 800,
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content || "{}";
        const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanContent);
        return parsed.ingredients || [];
    } catch (error: any) {
        console.error("Error identifying ingredients:", error);
        if (error?.status === 429) {
            throw new Error("API Quota Exceeded. Please check your OpenAI billing plan.");
        }
        if (error?.status === 401) {
            throw new Error("Invalid API Key. Please check your .env.local file.");
        }
        throw new Error(error.message || "Failed to identify ingredients");
    }
}

export async function generateRecipe(
    ingredients: Ingredient[],
    cuisine: string,
    equipment: string[]
): Promise<Recipe> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
    const openai = new OpenAI({ apiKey });

    const ingredientList = ingredients.map(i => `${i.name} (${i.expiry_status})`).join(", ");
    const equipmentStr = equipment.length ? equipment.join(", ") : "Standard kitchen equipment";

    const prompt = `
    Create a creative, tasty ${cuisine} recipe using ONLY these ingredients: ${ingredientList}.
    Tools available: ${equipmentStr}.
    
    Prioritize using ingredients marked as 'soon' or 'expired' to reduce waste.
    
    Return a JSON object with this structure:
    {
      "title": "Recipe Title",
      "ingredients": ["1 cup milk", ...],
      "instructions": ["Step 1...", ...],
      "health_score": 8,
      "health_reasoning": "Why it got this score",
      "magic_spice": "Name of one cheap spice/ingredient to add",
      "magic_spice_reasoning": "Why this elevates the dish"
    }
  `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a world-class chef and nutritionist who hates food waste." },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content || "{}";
        return JSON.parse(content) as Recipe;
    } catch (error: any) {
        console.error("Error generating recipe:", error);
        if (error?.status === 429) {
            throw new Error("API Quota Exceeded. Please check your OpenAI billing plan.");
        }
        throw new Error(error.message || "Failed to generate recipe");
    }
}
