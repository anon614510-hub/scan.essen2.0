import fs from 'fs/promises';
import path from 'path';
import { Ingredient, Recipe } from './types';
import { prisma } from './db';

const DB_PATH = path.join(process.cwd(), 'data.json');

export interface UserData {
    ingredients: Ingredient[];
    recipes: {
        recipe: Recipe;
        date: string; // ISO string
    }[];
    stats: {
        healthScore: number;
        recipesCooked: number;
        ingredientsSaved: number;
        wasteSaved: number; // percentage
    };
}

const DEFAULT_DATA: UserData = {
    ingredients: [],
    recipes: [],
    stats: {
        healthScore: 7, // Default starting score
        recipesCooked: 0,
        ingredientsSaved: 0,
        wasteSaved: 0
    }
};

async function readLocalDb(): Promise<UserData> {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return DEFAULT_DATA;
    }
}

async function writeLocalDb(data: UserData): Promise<void> {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Ensure user exists in DB
async function ensureUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        // Create user with default stats
        await prisma.user.create({
            data: {
                id: userId,
                email: "user@clerk", // Placeholder/Managed by Clerk, not critical here
                stats: {
                    create: {
                        healthScore: 7.0,
                        recipesCooked: 0,
                        ingredientsSaved: 0,
                        wasteSaved: 0
                    }
                }
            }
        });
    }
}


export async function getIngredients(userId?: string | null): Promise<Ingredient[]> {
    if (userId) {
        // --- CLOUD STRATEGY ---
        const ingredients = await prisma.ingredient.findMany({
            where: { userId }
        });
        return ingredients.map(i => ({
            name: i.name,
            quantity: i.quantity || undefined,
            expiry_status: (i.expiryStatus as any) || undefined,
            expiry_reasoning: i.expiryReasoning || undefined
        }));
    } else {
        // --- LOCAL STRATEGY ---
        const db = await readLocalDb();
        return db.ingredients;
    }
}

export async function saveIngredients(newIngredients: Ingredient[], userId?: string | null): Promise<void> {
    if (userId) {
        // --- CLOUD STRATEGY ---
        await ensureUser(userId);

        // 1. Save Ingredients
        // To keep it simple and match local logic (cumulative), we just create them.
        // Improvements: Deduplicate? For now, let's just create.
        await prisma.ingredient.createMany({
            data: newIngredients.map(i => ({
                userId,
                name: i.name,
                quantity: i.quantity,
                expiryStatus: i.expiry_status,
                expiryReasoning: i.expiry_reasoning
            }))
        });

        // 2. Update Stats (Ingredients Saved)
        const stats = await prisma.userStats.findUnique({ where: { userId } });
        if (stats) {
            const newCount = stats.ingredientsSaved + newIngredients.length;
            const newWaste = Math.min(95, 20 + newCount * 5); // Demo logic

            await prisma.userStats.update({
                where: { userId },
                data: {
                    ingredientsSaved: newCount,
                    wasteSaved: newWaste
                }
            });
        }
    } else {
        // --- LOCAL STRATEGY ---
        const db = await readLocalDb();
        const existingMap = new Map(db.ingredients.map(i => [i.name.toLowerCase(), i]));
        newIngredients.forEach(i => existingMap.set(i.name.toLowerCase(), i));
        db.ingredients = Array.from(existingMap.values());

        db.stats.ingredientsSaved += newIngredients.length;
        db.stats.wasteSaved = Math.min(95, 20 + db.stats.ingredientsSaved * 5);

        await writeLocalDb(db);
    }
}

export async function clearIngredients(userId?: string | null): Promise<void> {
    if (userId) {
        await prisma.ingredient.deleteMany({ where: { userId } });
    } else {
        const db = await readLocalDb();
        db.ingredients = [];
        await writeLocalDb(db);
    }
}

export async function saveRecipeToHistory(recipe: Recipe, userId?: string | null): Promise<void> {
    if (userId) {
        // --- CLOUD STRATEGY ---
        await ensureUser(userId);

        // 1. Save Recipe
        await prisma.recipeHistory.create({
            data: {
                userId,
                recipe: recipe as any // JSON
            }
        });

        // 2. Update Stats
        const stats = await prisma.userStats.findUnique({ where: { userId } });
        if (stats) {
            const currentHealth = stats.healthScore;
            const recipeHealth = recipe.health_score;
            const newHealth = Number(((currentHealth * 0.7) + (recipeHealth * 0.3)).toFixed(1));

            await prisma.userStats.update({
                where: { userId },
                data: {
                    recipesCooked: { increment: 1 },
                    healthScore: newHealth
                }
            });
        }

    } else {
        // --- LOCAL STRATEGY ---
        const db = await readLocalDb();
        db.recipes.unshift({
            recipe,
            date: new Date().toISOString()
        });
        db.stats.recipesCooked += 1;
        const currentHealth = db.stats.healthScore;
        const recipeHealth = recipe.health_score;
        db.stats.healthScore = Number(((currentHealth * 0.7) + (recipeHealth * 0.3)).toFixed(1));
        await writeLocalDb(db);
    }
}

export async function getHistory(userId?: string | null): Promise<{ recipe: Recipe; date: string }[]> {
    if (userId) {
        const history = await prisma.recipeHistory.findMany({
            where: { userId },
            orderBy: { savedAt: 'desc' }
        });
        return history.map(h => ({
            recipe: h.recipe as unknown as Recipe,
            date: h.savedAt.toISOString()
        }));
    } else {
        const db = await readLocalDb();
        return db.recipes;
    }
}

export async function getUserStats(userId?: string | null) {
    if (userId) {
        const stats = await prisma.userStats.findUnique({ where: { userId } });
        if (!stats) return DEFAULT_DATA.stats;
        return {
            healthScore: stats.healthScore,
            recipesCooked: stats.recipesCooked,
            ingredientsSaved: stats.ingredientsSaved,
            wasteSaved: stats.wasteSaved
        };
    } else {
        const db = await readLocalDb();
        return db.stats;
    }
}
