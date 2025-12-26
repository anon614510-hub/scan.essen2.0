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
}
