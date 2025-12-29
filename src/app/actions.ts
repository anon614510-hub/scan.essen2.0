"use server";

import OpenAI from "openai";
import { Ingredient, Recipe } from "@/lib/types";

// Lazy initialization to avoid errors when API key is not set
function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return null;
    }
    return new OpenAI({ apiKey });
}

/**
 * Analyze a fridge image to detect ingredients
 */
export async function analyzeImage(base64Image: string): Promise<{
    ingredients: Ingredient[];
    error?: string;
}> {
    try {
        const openai = getOpenAIClient();
        if (!openai) {
            return { ingredients: [], error: "OpenAI API key not configured" };
        }

        // Extract base64 data (remove data URL prefix if present)
        const base64Data = base64Image.includes(",")
            ? base64Image.split(",")[1]
            : base64Image;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a food ingredient detection assistant. Analyze the fridge/food image and identify all visible ingredients.
                    
For each ingredient, provide:
- name: the ingredient name
- quantity: estimated quantity (e.g., "2 pieces", "1 carton", "half full")
- expiry_status: "fresh", "soon" (will expire soon), or "expired"
- expiry_reasoning: brief reason for the expiry status

Respond with a JSON array of ingredients only, no other text. Example:
[{"name": "Eggs", "quantity": "6 pieces", "expiry_status": "fresh", "expiry_reasoning": "Shell looks intact and clean"}]`,
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Identify all the food ingredients visible in this fridge image:",
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Data}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content || "[]";

        // Parse the JSON response
        let ingredients: Ingredient[] = [];
        try {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                ingredients = JSON.parse(jsonMatch[0]);
            }
        } catch {
            console.error("Failed to parse ingredients:", content);
            return { ingredients: [], error: "Failed to parse ingredients from image" };
        }

        return { ingredients };
    } catch (error) {
        console.error("Image analysis error:", error);
        return {
            ingredients: [],
            error: error instanceof Error ? error.message : "Failed to analyze image",
        };
    }
}

/**
 * Generate a recipe from detected ingredients
 */
export async function generateRecipe(
    ingredients: Ingredient[],
    cuisine: string = "Any",
    equipment: string[] = []
): Promise<{
    recipe: Recipe | null;
    error?: string;
}> {
    try {
        const openai = getOpenAIClient();
        if (!openai) {
            return { recipe: null, error: "OpenAI API key not configured" };
        }

        if (ingredients.length === 0) {
            return { recipe: null, error: "No ingredients provided" };
        }

        const ingredientList = ingredients
            .map((i) => `${i.name}${i.quantity ? ` (${i.quantity})` : ""}`)
            .join(", ");

        const equipmentNote = equipment.length > 0
            ? `Available equipment: ${equipment.join(", ")}.`
            : "";

        const cuisineNote = cuisine !== "Any"
            ? `The recipe should be ${cuisine} cuisine style.`
            : "";

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a creative AI chef. Generate a delicious, practical recipe using the provided ingredients.

${cuisineNote}
${equipmentNote}

Respond with a JSON object containing:
- title: creative recipe name
- ingredients: array of ingredient strings with quantities
- instructions: array of step-by-step cooking instructions
- health_score: 1-10 rating based on nutritional value
- health_reasoning: brief explanation of health score
- magic_spice: one additional ingredient suggestion to elevate the dish
- magic_spice_reasoning: why this spice would work

Respond with JSON only, no other text.`,
                },
                {
                    role: "user",
                    content: `Create a recipe using these ingredients: ${ingredientList}`,
                },
            ],
            max_tokens: 1500,
        });

        const content = response.choices[0]?.message?.content || "{}";

        // Parse the JSON response
        let recipe: Recipe | null = null;
        try {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                recipe = JSON.parse(jsonMatch[0]);
            }
        } catch {
            console.error("Failed to parse recipe:", content);
            return { recipe: null, error: "Failed to parse recipe response" };
        }

        return { recipe };
    } catch (error) {
        console.error("Recipe generation error:", error);
        return {
            recipe: null,
            error: error instanceof Error ? error.message : "Failed to generate recipe",
        };
    }
}
