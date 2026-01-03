"use server";

import { Ingredient, Recipe } from "@/lib/types";
import {
    saveIngredients,
    getIngredients,
    saveRecipeToHistory,
    getHistory,
    getUserStats,
    clearIngredients
} from "@/lib/store";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { UserProfile } from "@prisma/client";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

console.log("DEBUG: API Key loaded:", OPENROUTER_API_KEY ? "YES" : "NO");
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

        // VERIFIED free vision models from OpenRouter API
        const visionModels = [
            "qwen/qwen-2.5-vl-72b-instruct:free",
            "google/gemini-2.0-pro-exp-02-05:free",
            "google/gemini-2.0-flash-lite-preview-02-05:free",
            "google/gemini-2.0-flash-exp:free",
            "nvidia/nemotron-nano-12b-v2-vl:free",
            "qwen/qwen-2.5-vl-7b-instruct:free"
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

                if (data.error || !response.ok) {
                    console.log(`Model ${model} failed (Status ${response.status}):`, JSON.stringify(data.error || data));
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
    preferences: string = ""
): Promise<{
    recipe: Recipe | null;
    error?: string;
}> {
    try {
        if (ingredients.length === 0) {
            return { recipe: null, error: "No ingredients provided" };
        }

        // --- PERSONALIZATION: Fetch User Profile ---
        console.log("DEBUG: Fetching user profile for recipe generation...");
        let profile = null;
        try {
            profile = await getProfileAction();
            console.log("DEBUG: Profile fetched:", profile ? "FOUND" : "NOT FOUND", profile);
        } catch (profileError) {
            console.error("DEBUG: Failed to fetch profile:", profileError);
            // Continue without profile rather than failing
        }

        let profileContext = "";
        if (profile) {
            profileContext = `
USER PROFILE (STRICTLY ADHERE TO THESE RULES):
- Dietary Type: ${profile.dietaryType}
- Allergies (FORBIDDEN): ${profile.allergies.join(", ")}
- Cooking Skill: ${profile.cookingSkill}
- Goals: ${profile.goals.join(", ")}

Important: If the user has allergies, DO NOT include those ingredients. If they are Vegan/Vegetarian, respect that strictly.
`;
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

        const prompt = `You are a creative AI chef. Generate a delicious, practical recipe using the provided ingredients.
        
${profileContext}

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
            "meta-llama/llama-3.3-70b-instruct:free",
            "mistralai/mistral-nemo:free",
            "google/gemini-2.0-flash-lite-preview-02-05:free",
            "knowledge/rubra-v1",
            "deepseek/deepseek-r1:free"
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

                if (data.error || !response.ok) {
                    console.log(`Model ${model} failed (Status ${response.status}):`, JSON.stringify(data.error || data));
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
export async function generateRecipeByName(name: string, equipment: string[] = []): Promise<{
    recipe: Recipe | null;
    error?: string;
}> {
    try {
        const equipmentText = equipment.length > 0
            ? `\nIMPORTANT: You must STRICTLY use ONLY the following equipment: ${equipment.join(", ")}. Do NOT use an oven, stove, or other appliances unless strictly specified.`
            : "";

        // --- PERSONALIZATION: Fetch User Profile ---
        const profile = await getProfileAction();
        let profileContext = "";
        if (profile) {
            profileContext = `
USER PROFILE (STRICTLY ADHERE TO THESE RULES):
- Dietary Type: ${profile.dietaryType}
- Allergies (FORBIDDEN): ${profile.allergies.join(", ")}
- Cooking Skill: ${profile.cookingSkill}
- Goals: ${profile.goals.join(", ")}

Important: If the user has allergies, DO NOT include those ingredients. If they are Vegan/Vegetarian, respect that strictly.
`;
        }

        const prompt = `You are a world-class chef. Create a detailed, healthy recipe for: "${name}".
Assume the user has basic pantry staples.${equipmentText}

${profileContext}

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
            "meta-llama/llama-3.3-70b-instruct:free",
            "mistralai/mistral-nemo:free",
            "google/gemini-2.0-flash-lite-preview-02-05:free",
            "knowledge/rubra-v1",
            "deepseek/deepseek-r1:free"
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

                if (data.error || !response.ok) {
                    console.log(`Model ${model} failed (Status ${response.status}):`, JSON.stringify(data.error || data));
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

export async function saveIngredientsAction(ingredients: Ingredient[]) {
    const { userId } = await auth();
    await saveIngredients(ingredients, userId);
}

export async function getIngredientsAction() {
    const { userId } = await auth();
    return await getIngredients(userId);
}

export async function clearIngredientsAction() {
    const { userId } = await auth();
    await clearIngredients(userId);
}

export async function saveRecipeAction(recipe: Recipe) {
    const { userId } = await auth();
    await saveRecipeToHistory(recipe, userId);
}

export async function getHistoryAction() {
    const { userId } = await auth();
    return await getHistory(userId);
}

export async function getStatsAction() {
    const { userId } = await auth();
    return await getUserStats(userId);
}

// --- Profile Actions ---

export async function getProfileAction(): Promise<UserProfile | null> {
    const { userId } = await auth();
    console.log("DEBUG: getProfileAction called. UserId:", userId);

    if (!userId) {
        console.log("DEBUG: No userId found in auth()");
        return null;
    }

    try {
        const profile = await prisma.userProfile.findUnique({
            where: { userId }
        });
        console.log("DEBUG: Prisma found profile:", profile);
        return profile;
    } catch (dbError) {
        console.error("DEBUG: Prisma error in getProfileAction:", dbError);
        throw dbError;
    }
}

export async function saveProfileAction(data: Partial<UserProfile>) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Ensure User exists before creating profile
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
        console.log("DEBUG: User record missing, creating stub for:", userId);

        // Try to get email from Clerk if possible, otherwise use placeholder
        let email = `${userId}@placeholder.com`;
        try {
            const { currentUser } = await import("@clerk/nextjs/server");
            const clerkUser = await currentUser();
            if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
                email = clerkUser.emailAddresses[0].emailAddress;
            }
        } catch (e) {
            console.error("Failed to fetch Clerk user details:", e);
        }

        await prisma.user.create({
            data: {
                id: userId,
                email: email,
            }
        });
    }

    await prisma.userProfile.upsert({
        where: { userId },
        update: {
            dietaryType: data.dietaryType,
            allergies: data.allergies,
            cookingSkill: data.cookingSkill,
            goals: data.goals,
            // Biometrics
            height: data.height,
            weight: data.weight,
            age: data.age,
            gender: data.gender,
        },
        create: {
            userId,
            dietaryType: data.dietaryType || "Omnivore",
            allergies: data.allergies || [],
            cookingSkill: data.cookingSkill || "Beginner",
            goals: data.goals || [],
            // Biometrics - default to null if not provided
            height: data.height,
            weight: data.weight,
            age: data.age,
            gender: data.gender,
        }
    });
}
