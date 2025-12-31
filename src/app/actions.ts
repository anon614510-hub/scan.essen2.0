"use server";

import { Ingredient, Recipe } from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to clean API keys (remove quotes, whitespace)
const cleanKey = (key: string | undefined) => key?.replace(/["']/g, "").trim();

const OPENROUTER_API_KEY = cleanKey(process.env.OPENROUTER_API_KEY);
const GEMINI_API_KEY = cleanKey(process.env.GEMINI_API_KEY);

console.log("DEBUG: API Keys check:", {
    openrouter: OPENROUTER_API_KEY ? "Defined" : "MISSING",
    gemini: GEMINI_API_KEY ? "Defined" : "MISSING"
});

if (!OPENROUTER_API_KEY) {
    console.warn("WARNING: OPENROUTER_API_KEY is not defined in environment variables.");
}

if (!GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is not defined. direct Gemini fallback will be unavailable.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Analyze a fridge image to detect ingredients using OpenRouter
 */
export async function analyzeImage(base64Image: string): Promise<{
    ingredients: Ingredient[];
    error?: string;
}> {
    try {
        const prompt = `You are a food ingredient detection assistant. Analyze the image and identify ALL visible food items and edible ingredients.
                    
This includes:
- Fresh produce (fruits, vegetables)
- Packaged foods and snacks
- Beverages and drinks
- Cooked dishes and prepared meals
- Baked goods (bread, pastries)
- Dairy products
- Meat, fish, and proteins
- Grains, cereals, and pasta
- Condiments and sauces
- Any other edible items

For each food item, provide:
- name: the food/ingredient name
- quantity: estimated quantity (e.g., "2 pieces", "1 packet", "half portion")
- expiry_status: "fresh", "soon" (will expire soon), or "expired"
- expiry_reasoning: brief reason for the expiry status

Respond with a JSON array of food items only, no other text. Example:
[{"name": "Chips", "quantity": "1 packet", "expiry_status": "fresh", "expiry_reasoning": "Sealed package"}]`;

        // 1. Try Google Gemini directly first (High Rate Limit)
        if (genAI) {
            const geminiModels = ["gemini-1.5-flash", "gemini-2.0-flash-exp"];
            for (const modelName of geminiModels) {
                try {
                    console.log(`Trying direct Google Gemini API (${modelName})...`);
                    const model = genAI.getGenerativeModel({ model: modelName });

                    // Convert base64 data URL to Google AI Format
                    const base64Data = base64Image.split(",")[1] || base64Image;
                    const mimeType = base64Image.match(/data:([^;]+);/)?.[1] || "image/jpeg";

                    const result = await model.generateContent([
                        { text: prompt },
                        {
                            inlineData: {
                                data: base64Data,
                                mimeType: mimeType
                            }
                        }
                    ]);

                    const content = result.response.text();
                    // Find and parse JSON array
                    const jsonMatch = content.match(/\[[\s\S]*\]/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0].replace(/,\s*\]/g, "]").replace(/,\s*\}/g, "}"));
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            console.log(`Gemini ${modelName} Success!`);
                            return { ingredients: parsed };
                        }
                    }
                } catch (geminiError: any) {
                    console.error(`Gemini (${modelName}) Image Error:`, geminiError.message || geminiError);
                    if (geminiError.status === 404) {
                        console.log(`Model ${modelName} not found or restricted. Trying next...`);
                        continue;
                    }
                }
            }
        }

        // VERIFIED free vision models from OpenRouter API
        const visionModels = [
            "meta-llama/llama-3.2-11b-vision-instruct:free",
            "google/gemma-3-12b-it:free",
            "qwen/qwen2.5-vl-72b-instruct:free",
            "qwen/qwen-2.5-vl-7b-instruct:free",
            "nvidia/nemotron-nano-12b-v2-vl:free",
            "google/gemini-2.0-flash-exp:free",
            "mistralai/pixtral-12b:free",
            "microsoft/phi-3.5-vision-instruct:free"
        ];

        for (const model of visionModels) {
            try {
                console.log(`Trying vision model: ${model}`);
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: prompt },
                                    { type: "image_url", image_url: { url: base64Image } }
                                ]
                            }
                        ]
                    }),
                });

                const data = await response.json();

                if (data.error) {
                    const errorMsg = data.error.message || "";
                    console.log(`DEBUG: Model ${model} failed explicitly:`, errorMsg);
                    if (errorMsg.includes("free-models-per-day") || errorMsg.includes("limit exceeded")) {
                        return { ingredients: [], error: "Daily limit reached for free models on OpenRouter. Please try again tomorrow or add a credit for more requests." };
                    }
                    continue;
                }

                const content = data.choices?.[0]?.message?.content || "[]";
                console.log(`Model ${model} SUCCESS! Response:`, content.substring(0, 300));

                let ingredients: Ingredient[] = [];
                try {
                    // Try to find a JSON array - use greedy match to get the full array
                    const jsonMatch = content.match(/\[[\s\S]*\]/);
                    if (jsonMatch) {
                        let jsonStr = jsonMatch[0];

                        // Clean up any trailing commas before closing brackets
                        jsonStr = jsonStr.replace(/,\s*\]/g, "]");
                        jsonStr = jsonStr.replace(/,\s*\}/g, "}");

                        try {
                            ingredients = JSON.parse(jsonStr);
                        } catch {
                            // If that fails, try to extract just the first complete array
                            const simpleMatch = content.match(/\[\s*\{[^[\]]*\}\s*\]/);
                            if (simpleMatch) {
                                ingredients = JSON.parse(simpleMatch[0]);
                            }
                        }

                        // Validate the parsed ingredients
                        if (!Array.isArray(ingredients)) {
                            ingredients = [];
                        } else {
                            // Filter out invalid entries
                            ingredients = ingredients.filter((item): item is Ingredient =>
                                typeof item === 'object' &&
                                item !== null &&
                                typeof item.name === 'string' &&
                                item.name.trim().length > 0
                            );
                        }
                    }
                } catch (parseError) {
                    console.error("DEBUG: Failed to parse ingredients from model " + model + ". Content was:", content);
                    continue; // Move to next model
                }

                // Return if we got valid ingredients
                if (ingredients.length > 0) {
                    return { ingredients };
                }
                console.log(`Model ${model} returned empty/invalid ingredients, trying next model...`);
            } catch (e) {
                console.log(`Model ${model} error:`, e);
            }
        }

        return { ingredients: [], error: "All vision models unavailable. Please check your OpenRouter API key in .env.local and try again." };
    } catch (error) {
        console.error("Image analysis error:", error);
        return {
            ingredients: [],
            error: error instanceof Error ? error.message : "Failed to analyze image",
        };
    }
}

/**
 * Generate a recipe from detected ingredients using OpenRouter
 */
export async function generateRecipe(
    ingredients: Ingredient[],
    cuisine: string = "Any",
    equipment: string[] = [],
    preferences: string = ""
): Promise<{
    recipe: Recipe | null;
    error?: string;
}> {
    try {
        if (ingredients.length === 0) {
            return { recipe: null, error: "No ingredients provided" };
        }

        console.log("DEBUG: generateRecipe called with", ingredients.length, "ingredients. Prefs:", preferences);

        const ingredientList = ingredients
            .map((i) => `${i.name}${i.quantity ? ` (${i.quantity})` : ""}`)
            .join(", ");

        const equipmentNote = equipment.length > 0
            ? `Available equipment: ${equipment.join(", ")}.`
            : "";

        const cuisineNote = cuisine !== "Any"
            ? `The recipe should be ${cuisine} cuisine style.`
            : "";

        const preferencesNote = preferences
            ? `User preferences/request: "${preferences}". Make sure to incorporate this into the recipe.`
            : "";

        const prompt = `You are a creative AI chef. Generate a delicious, practical recipe using the provided ingredients.

${cuisineNote}
${equipmentNote}
${preferencesNote}

Respond with a JSON object containing:
- title: creative recipe name
- ingredients: array of ingredient strings with quantities
- instructions: array of step-by-step cooking instructions
- health_score: 1-10 rating based on nutritional value
- health_reasoning: brief explanation of health score
- magic_spice: one additional ingredient suggestion to elevate the dish
- magic_spice_reasoning: why this spice would work
- image_keywords: a comma-separated list of 3-5 descriptive keywords for high-quality food photography search (e.g., "creamy, pasta, basil, dish")

Respond with JSON only, no other text.

Create a recipe using these ingredients: ${ingredientList}`;

        // 1. Try Google Gemini directly first (High Rate Limit)
        if (genAI) {
            const geminiModels = ["gemini-1.5-flash", "gemini-2.0-flash-exp"];
            for (const modelName of geminiModels) {
                try {
                    console.log(`Trying direct Google Gemini API (${modelName}) for recipe...`);
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    const content = result.response.text();

                    // Find and parse JSON object
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0].replace(/,\s*\}/g, "}").replace(/,\s*\]/g, "]"));

                        const recipe: Recipe = {
                            title: parsed.title || "Delicious Recipe",
                            ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
                            instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
                            health_score: typeof parsed.health_score === 'number' ? parsed.health_score : 7,
                            health_reasoning: parsed.health_reasoning || "A balanced and nutritious dish.",
                            magic_spice: parsed.magic_spice || "",
                            magic_spice_reasoning: parsed.magic_spice_reasoning || "",
                            youtube_urls: [
                                `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.title + " recipe guide")}`,
                                `https://www.youtube.com/results?search_query=${encodeURIComponent("how to cook " + parsed.title)}`
                            ],
                            vlog_urls: [
                                `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.title + " cooking vlog #Shorts")}`,
                                `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.title + " 60 second recipe")}`,
                                `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.title + " quick recipe guide")}`,
                                `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.title + " meal prep shorts")}`,
                                `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.title + " easy cooking vlog")}`
                            ],
                            image_urls: [],
                        };

                        if (recipe.title !== "Delicious Recipe" || recipe.ingredients.length > 0) {
                            console.log(`Gemini ${modelName} Recipe Success!`);
                            return { recipe };
                        }
                    }
                } catch (geminiError: any) {
                    console.error(`Gemini (${modelName}) Recipe error:`, geminiError.message || geminiError);
                    // Continue to next Gemini model
                }
            }
        }

        // 2. OpenRouter Fallback

        // Verified working free text models (open source)
        const textModels = [
            "google/gemini-2.0-flash-exp:free",
            "meta-llama/llama-3.1-8b-instruct:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "google/gemma-3-27b-it:free",
            "qwen/qwen-2.5-72b-instruct:free",
            "mistralai/mistral-nemo:free",
            "deepseek/deepseek-r1:free"
        ];

        for (const model of textModels) {
            try {
                console.log(`Trying text model: ${model}`);
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: "user", content: prompt }
                        ]
                    }),
                });

                const data = await response.json();

                if (data.error) {
                    const errorMsg = data.error.message || "";
                    console.log(`Model ${model} failed:`, errorMsg);
                    if (errorMsg.includes("free-models-per-day") || errorMsg.includes("limit exceeded")) {
                        return { recipe: null, error: "Daily limit reached for free models on OpenRouter (50 requests/day). Please try again tomorrow or add credits to your OpenRouter account to unlock 1000 free requests/day." };
                    }
                    continue;
                }

                const content = data.choices?.[0]?.message?.content || "{}";
                console.log(`Model ${model} SUCCESS! Content:`, content.substring(0, 500));

                let recipe: Recipe | null = null;
                try {
                    // Try to find a JSON object - use greedy match
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        let jsonStr = jsonMatch[0];

                        // Clean up trailing commas
                        jsonStr = jsonStr.replace(/,\s*\}/g, "}");
                        jsonStr = jsonStr.replace(/,\s*\]/g, "]");

                        const parsed = JSON.parse(jsonStr);

                        // Ensure recipe has all required fields with defaults
                        recipe = {
                            title: parsed.title || "Delicious Recipe",
                            ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
                            instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
                            health_score: typeof parsed.health_score === 'number' ? parsed.health_score : 7,
                            health_reasoning: parsed.health_reasoning || "A balanced and nutritious dish.",
                            magic_spice: parsed.magic_spice || "",
                            magic_spice_reasoning: parsed.magic_spice_reasoning || "",
                            youtube_urls: [
                                `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.title + " recipe guide")}`,
                                `https://www.youtube.com/results?search_query=${encodeURIComponent("how to cook " + parsed.title)}`
                            ],
                            vlog_urls: [
                                `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.title + " cooking vlog #Shorts")}`,
                                `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.title + " 60 second recipe")}`,
                                `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.title + " quick recipe guide")}`,
                                `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.title + " meal prep shorts")}`,
                                `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.title + " easy cooking vlog")}`
                            ],
                            image_urls: [],
                        };

                        // Validate recipe has at least a title
                        if (recipe && (!recipe.title || (recipe.title === "Delicious Recipe" && recipe.ingredients.length === 0))) {
                            console.log("Invalid recipe structure, trying next model...");
                            recipe = null;
                            continue;
                        }

                        console.log("Parsed recipe successfully:", recipe.title);
                    }
                } catch (parseError) {
                    console.error("DEBUG: Failed to parse recipe from model " + model + ". Content was:", content);
                    continue;
                }

                if (recipe) {
                    return { recipe };
                }
            } catch (e) {
                console.log(`DEBUG: Model ${model} network/fetch error:`, e);
            }
        }

        return { recipe: null, error: "AI temporary busy. Please try clicking 'Search' again in a few seconds." };
    } catch (error) {
        console.error("Recipe generation error:", error);
        return {
            recipe: null,
            error: error instanceof Error ? error.message : "Failed to generate recipe",
        };
    }
}
