export interface Ingredient {
    name: string;
    quantity?: string;
    expiry_status?: "fresh" | "soon" | "expired";
    expiry_reasoning?: string;
}

export interface Recipe {
    title: string;
    ingredients: string[];
    instructions: string[];
    health_score: number;
    health_reasoning?: string;
    magic_spice?: string;
    magic_spice_reasoning?: string;
    youtube_search_query?: string;
    restricted_ingredients?: string[];
}

export interface UserProfile {
    healthConditions: string[];
    dietaryApproach: 'Omnivore' | 'Vegetarian' | 'Vegan' | 'Flexitarian';
    goals: string[];
    cookingTime: 'Time Crunch' | 'Standard' | 'Project Cook';
    cookingConfidence: 'Beginner' | 'Intermediate' | 'Pro';
    allergies: string[];
    age?: number;
    sex?: 'Female' | 'Male' | 'Prefer not to say';
    customDislikes?: string;
    state?: string;
    preferredLanguage?: 'Hindi' | 'Gujarati' | 'Tamil' | 'Telugu' | 'English' | 'Marathi' | 'Bengali' | 'Kannada' | 'Malayalam' | 'Punjabi';
}
