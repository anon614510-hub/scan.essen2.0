'use server'

import { currentUser } from '@clerk/nextjs/server'
import { prisma } from './db'
import { UserProfile } from './types'

import { Ingredient, Recipe } from './types'

export async function getOrCreateDbUser() {
    try {
        const user = await currentUser();
        if (!user) return null;

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { profile: true }
        });

        if (dbUser) return dbUser;

        return await prisma.user.create({
            data: {
                id: user.id,
                email: user.emailAddresses[0]?.emailAddress || 'no-email',
            },
            include: { profile: true }
        });
    } catch (error) {
        console.error("DB Error:", error);
        return null;
    }
}

export async function saveDbUserProfile(profile: UserProfile) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const { age, sex, healthConditions, dietaryApproach, goals, cookingTime, cookingConfidence, allergies, customDislikes, state, preferredLanguage } = profile;

    return await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
            age: age || null,
            sex: sex || null,
            healthConditions,
            dietaryApproach,
            goals,
            cookingTime,
            cookingConfidence,
            allergies,
            customDislikes: customDislikes || null,
            state: state || null,
            preferredLanguage: preferredLanguage || null
        },
        create: {
            userId: user.id,
            age: age || null,
            sex: sex || null,
            healthConditions,
            dietaryApproach,
            goals,
            cookingTime,
            cookingConfidence,
            allergies,
            customDislikes: customDislikes || null,
            state: state || null,
            preferredLanguage: preferredLanguage || null
        }
    });
}

export async function saveUserIngredients(ingredients: Ingredient[]) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    // Transaction logic: Atomic delete + create
    // This is safer than separate calls and performance optimized
    await prisma.$transaction([
        prisma.ingredient.deleteMany({ where: { userId: user.id } }),
        ...(ingredients.length > 0 ? [
            prisma.ingredient.createMany({
                data: ingredients.map(i => ({
                    userId: user.id,
                    name: i.name,
                    quantity: i.quantity || null,
                    expiryStatus: i.expiry_status || null
                }))
            })
        ] : [])
    ]);
}

export async function saveUserRecipe(recipe: Recipe) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    await prisma.recipe.create({
        data: {
            userId: user.id,
            title: recipe.title,
            healthScore: recipe.health_score,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content: recipe as any
        }
    });
}

export async function getUserDashboardData() {
    const user = await currentUser();
    if (!user) return { recipesCooked: 0, ingredientsCount: 0, healthScore: 0, wasteSaved: 0 };

    try {
        // Parallel queries for performance
        const [recipeCount, ingredientsCount, healthAggregate] = await Promise.all([
            prisma.recipe.count({ where: { userId: user.id } }),
            prisma.ingredient.count({ where: { userId: user.id } }),
            prisma.recipe.aggregate({
                where: { userId: user.id },
                _avg: { healthScore: true }
            })
        ]);

        return {
            recipesCooked: recipeCount,
            ingredientsCount: ingredientsCount,
            healthScore: Math.round(healthAggregate._avg.healthScore || 0) || 7,
            wasteSaved: Math.min(95, 20 + ingredientsCount * 5)
        };
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        return { recipesCooked: 0, ingredientsCount: 0, healthScore: 0, wasteSaved: 0 };
    }
}

export async function getUserHistory() {
    const user = await currentUser();
    if (!user) return [];

    try {
        const recipes = await prisma.recipe.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return recipes.map(r => ({
            recipe: r.content as unknown as Recipe,
            date: r.createdAt.toISOString()
        }));
    } catch (error) {
        console.error("Failed to fetch history:", error);
        return [];
    }
}
