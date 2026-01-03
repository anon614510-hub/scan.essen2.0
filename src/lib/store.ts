import fs from 'fs/promises';
import path from 'path';
import { Ingredient, Recipe, UserProfile } from './types';

const DB_PATH = path.join(process.cwd(), 'data.json');

export interface UserData {
    ingredients: Ingredient[];
    recipes: {
        recipe: Recipe;
        date: string; // ISO string
    }[];
    profile?: UserProfile;
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

async function readDb(): Promise<UserData> {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return default
        return DEFAULT_DATA;
    }
}

async function writeDb(data: UserData): Promise<void> {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getIngredients(): Promise<Ingredient[]> {
    const db = await readDb();
    return db.ingredients;
}

export async function saveIngredients(newIngredients: Ingredient[]): Promise<void> {
    const db = await readDb();
    // Simple strategy: merge new ingredients with existing ones, or just append
    // For now, we'll append unique ones or just replace current session ingredients if we want a "fresh scan" feel.
    // However, the user said "recipes history nor users data stored nothing", implying they want retention.
    // Let's keep a cumulative list but remove duplicates by name.

    const existingMap = new Map(db.ingredients.map(i => [i.name.toLowerCase(), i]));
    newIngredients.forEach(i => existingMap.set(i.name.toLowerCase(), i));

    db.ingredients = Array.from(existingMap.values());

    // Update stats: ingredients saved
    db.stats.ingredientsSaved += newIngredients.length;
    // Cap waste saved for demo logic
    db.stats.wasteSaved = Math.min(95, 20 + db.stats.ingredientsSaved * 5);

    await writeDb(db);
}

export async function clearIngredients(): Promise<void> {
    const db = await readDb();
    db.ingredients = [];
    await writeDb(db);
}

export async function saveRecipeToHistory(recipe: Recipe): Promise<void> {
    const db = await readDb();

    db.recipes.unshift({
        recipe,
        date: new Date().toISOString()
    }); // Add to top

    // Update stats
    db.stats.recipesCooked += 1;

    // Update health score (simple moving average-ish)
    const currentHealth = db.stats.healthScore;
    const recipeHealth = recipe.health_score;
    db.stats.healthScore = Number(((currentHealth * 0.7) + (recipeHealth * 0.3)).toFixed(1));

    await writeDb(db);
}

export async function getHistory(): Promise<{ recipe: Recipe; date: string }[]> {
    const db = await readDb();
    return db.recipes;
}

export async function getUserStats() {
    const db = await readDb();
    return db.stats;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
    const db = await readDb();
    db.profile = profile;
    await writeDb(db);
}

export async function getProfile(): Promise<UserProfile | null> {
    const db = await readDb();
    return db.profile || null;
}
