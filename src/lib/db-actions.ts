'use server'

import { currentUser } from '@clerk/nextjs/server'
import { prisma } from './db'
import { UserProfile } from './types'

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
