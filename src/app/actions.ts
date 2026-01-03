"use server";

import { Ingredient, Recipe } from "@/lib/types";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

console.log("DEBUG: API Key loaded:", process.env.OPENROUTER_API_KEY ? "YES (" + process.env.OPENROUTER_API_KEY.substring(0, 10) + "...)" : "NO (Using backup)");
console.log("DEBUG: YouTube API Key loaded:", YOUTUBE_API_KEY ? "YES" : "NO");

export interface YouTubeVideo {
    videoId: string;
    title: string;
    thumbnail: string;
}

/**
 * Search YouTube for videos matching a query
 */
export async function searchYouTubeVideos(query: string, maxResults: number = 2): Promise<{
    videos: YouTubeVideo[];
    error?: string;
}> {
    try {
        if (!YOUTUBE_API_KEY) {
            return { videos: [], error: "YouTube API key not configured" };
        }

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + " recipe")}&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
        );

        const data = await response.json();

        if (data.error) {
            console.error("YouTube API error:", data.error);
            return { videos: [], error: data.error.message || "YouTube API error" };
        }

        const videos: YouTubeVideo[] = (data.items || []).map((item: any) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
        }));

        return { videos };
    } catch (error) {
        console.error("YouTube search error:", error);
        return { videos: [], error: "Failed to search YouTube" };
    }
}


/**
 * Analyze a fridge image to detect ingredients using OpenRouter
 */
export async function analyzeImage(base64Image: string, locale: string = "en"): Promise<{
    ingredients: Ingredient[];
    error?: string;
}> {
    try {
        const languageName = locale === 'es' ? 'Spanish' : 'English';
        const prompt = `You are a food ingredient detection assistant. Analyze the image and identify ALL visible food items and edible ingredients.
        
IMPORTANT: Return the "expiry_reasoning" in ${languageName}.
                    
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

        // VERIFIED free vision models from OpenRouter API
        const visionModels = [
            "qwen/qwen2.5-vl-72b-instruct:free",
            "qwen/qwen-2.5-vl-7b-instruct:free",
            "google/gemma-3-12b-it:free",
            "google/gemma-3-4b-it:free",
            "nvidia/nemotron-nano-12b-v2-vl:free",
            "google/gemini-2.0-flash-exp:free"
        ];

        for (const model of visionModels) {
            try {
                console.log(`Trying vision model: ${model}`);
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "Scan-Essen"
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
                    console.log(`Model ${model} failed:`, JSON.stringify(data.error));
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
                    console.error("Failed to parse ingredients:", parseError);
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

        return { ingredients: [], error: "All vision models unavailable. Please try again." };
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
    preferences: string = "",
    locale: string = "en"
): Promise<{
    recipe: Recipe | null;
    error?: string;
}> {
    try {
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

        const preferencesNote = preferences
            ? `User preferences/request: "${preferences}". Make sure to incorporate this into the recipe.`
            : "";

        const languageName = locale === 'es' ? 'Spanish' : 'English';
        const prompt = `You are a creative AI chef. Generate a delicious, practical recipe using the provided ingredients.
IMPORTANT: Respond entirely in ${languageName} (titles, instructions, reasoning).

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
- youtube_search_query: a generic, popular search term for this type of dish (e.g. "Chocolate Cake" instead of "My Special Chocolate Cake") to find video tutorials

Respond with JSON only, no other text.

Create a recipe using these ingredients: ${ingredientList}`;

        // Verified working free text models (open source)
        const textModels = [
            "nousresearch/deephermes-3-llama-3-8b-preview:free",
            "nousresearch/hermes-3-llama-3.1-70b:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "mistralai/mistral-nemo:free",
            "deepseek/deepseek-r1:free",
            "moonshotai/kimi-k2:free",
            "google/gemma-3-27b-it:free",
            "qwen/qwen-2.5-vl-7b-instruct:free",
            "google/gemma-3-12b-it:free",
            "google/gemma-3-4b-it:free"
        ];

        for (const model of textModels) {
            try {
                console.log(`Trying text model: ${model}`);
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "Scan-Essen"
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
                    console.log(`Model ${model} failed:`, JSON.stringify(data.error));
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
                            youtube_search_query: parsed.youtube_search_query || ""
                        };

                        // Validate recipe has at least a title
                        if (!recipe.title || recipe.title === "Delicious Recipe" && recipe.ingredients.length === 0) {
                            console.log("Invalid recipe structure, trying next model...");
                            continue;
                        }

                        console.log("Parsed recipe successfully:", recipe.title);
                    }
                } catch (parseError) {
                    console.error("Failed to parse recipe:", parseError);
                    continue;
                }

                if (recipe) {
                    return { recipe };
                }
            } catch (e) {
                console.log(`Model ${model} error:`, e);
            }
        }

        return { recipe: null, error: "All models unavailable. Please try again." };
    } catch (error) {
        console.error("Recipe generation error:", error);
        return {
            recipe: null,
            error: error instanceof Error ? error.message : "Failed to generate recipe",
        };
    }

}

/**
 * Generate a recipe by name (Generative Search)
 */
export async function generateRecipeByName(name: string, equipment: string[] = [], locale: string = "en"): Promise<{
    recipe: Recipe | null;
    error?: string;
}> {
    try {
        const equipmentText = equipment.length > 0
            ? `\nIMPORTANT: You must STRICTLY use ONLY the following equipment: ${equipment.join(", ")}. Do NOT use an oven, stove, or other appliances unless strictly specified.`
            : "";

        const languageName = locale === 'es' ? 'Spanish' : 'English';
        const prompt = `You are a world-class chef. Create a detailed, healthy recipe for: "${name}".
IMPORTANT: Respond entirely in ${languageName}.
Assume the user has basic pantry staples.${equipmentText}

Respond with a JSON object containing:
- title: creative recipe name (based on "${name}")
- ingredients: array of ingredient strings with quantities
- instructions: array of step-by-step cooking instructions
- health_score: 1-10 rating based on nutritional value
- health_reasoning: brief explanation of health score
- magic_spice: one additional ingredient suggestion to elevate the dish
- magic_spice: one additional ingredient suggestion to elevate the dish
- magic_spice_reasoning: why this spice would work
- youtube_search_query: a generic, popular search term for this type of dish (e.g. "Chocolate Cake" instead of "My Special Chocolate Cake") to find video tutorials

Respond with JSON only, no other text.`;

        // Verified working free text models (open source)
        const textModels = [
            "nousresearch/deephermes-3-llama-3-8b-preview:free",
            "nousresearch/hermes-3-llama-3.1-70b:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "mistralai/mistral-nemo:free",
            "deepseek/deepseek-r1:free",
            "moonshotai/kimi-k2:free",
            "google/gemma-3-27b-it:free",
            "qwen/qwen-2.5-vl-7b-instruct:free",
            "google/gemma-3-12b-it:free",
            "google/gemma-3-4b-it:free"
        ];

        for (const model of textModels) {
            try {
                console.log(`Trying text model for generation: ${model}`);
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "Scan-Essen"
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
                    console.log(`Model ${model} failed:`, JSON.stringify(data.error));
                    continue;
                }

                const content = data.choices?.[0]?.message?.content || "{}";
                console.log(`Model ${model} SUCCESS! Content:`, content.substring(0, 200));

                let recipe: Recipe | null = null;
                try {
                    // Try to find a JSON object - use greedy match
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        let jsonStr = jsonMatch[0];
                        jsonStr = jsonStr.replace(/,\s*\}/g, "}");
                        jsonStr = jsonStr.replace(/,\s*\]/g, "]");
                        const parsed = JSON.parse(jsonStr);

                        recipe = {
                            title: parsed.title || name,
                            ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
                            instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
                            health_score: typeof parsed.health_score === 'number' ? parsed.health_score : 7,
                            health_reasoning: parsed.health_reasoning || "A balanced and nutritious dish.",
                            magic_spice: parsed.magic_spice || "",
                            magic_spice_reasoning: parsed.magic_spice_reasoning || "",
                            youtube_search_query: parsed.youtube_search_query || ""
                        };

                        if (recipe.ingredients.length > 0) {
                            return { recipe };
                        }
                    }
                } catch (parseError) {
                    console.error("Failed to parse recipe:", parseError);
                    continue;
                }
            } catch (e) {
                console.log(`Model ${model} error:`, e);
            }
        }

        return { recipe: null, error: "Failed to generate recipe. Please try again." };

    } catch (error) {
        console.error("Recipe generation error:", error);
        return { recipe: null, error: "Failed to generate recipe" };
    }
}

// --- Persistence Actions ---
import {
    saveIngredients,
    getIngredients,
    saveRecipeToHistory,
    getHistory,
    getUserStats,
    clearIngredients
} from "@/lib/store";

export async function saveIngredientsAction(ingredients: Ingredient[]) {
    await saveIngredients(ingredients);
}

export async function getIngredientsAction() {
    return await getIngredients();
}

export async function clearIngredientsAction() {
    await clearIngredients();
}

export async function saveRecipeAction(recipe: Recipe) {
    await saveRecipeToHistory(recipe);
}

export async function getHistoryAction() {
    return await getHistory();
}

export async function getStatsAction() {
    return await getUserStats();
}
