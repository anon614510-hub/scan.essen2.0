import { Recipe } from "@/lib/types";
import { CheckCircle, AlertCircle, ChefHat } from "lucide-react";
import clsx from "clsx";

interface RecipeDisplayProps {
    recipe: Recipe;
    onReset: () => void;
}

export default function RecipeDisplay({ recipe, onReset }: RecipeDisplayProps) {
    const getHealthColor = (score: number) => {
        if (score >= 8) return "bg-green-100 text-green-700 border-green-200";
        if (score >= 5) return "bg-yellow-100 text-yellow-700 border-yellow-200";
        return "bg-red-100 text-red-700 border-red-200";
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-primary/10 p-6 border-b border-primary/10 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    <ChefHat className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{recipe.title}</h2>
                    <p className="text-sm text-gray-500">AI Chef's Recommendation</p>
                </div>
                <div className={clsx(
                    "ml-auto px-4 py-2 rounded-xl border flex flex-col items-center justify-center",
                    getHealthColor(recipe.health_score)
                )}>
                    <span className="text-xs font-bold uppercase tracking-wider">Health</span>
                    <span className="text-2xl font-black">{recipe.health_score}/10</span>
                </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
                {/* Ingredients */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-secondary rounded-full"></span>
                        Ingredients
                    </h3>
                    <ul className="grid sm:grid-cols-2 gap-3">
                        {recipe.ingredients.map((ing, i) => (
                            <li key={i} className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                                <span>{ing}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Instructions */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-secondary rounded-full"></span>
                        Instructions
                    </h3>
                    <div className="space-y-4">
                        {recipe.instructions.map((step, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold shrink-0">
                                    {i + 1}
                                </div>
                                <p className="text-gray-700 pt-1 leading-relaxed">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Magic Spice */}
                {recipe.magic_spice && (
                    <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-5 rounded-2xl border border-orange-200">
                        <h3 className="text-sm font-bold uppercase text-orange-800 tracking-wider mb-2 flex items-center gap-2">
                            ✨ Magic Spice Suggestion
                        </h3>
                        <p className="text-xl font-bold text-gray-900 mb-1">{recipe.magic_spice}</p>
                        <p className="text-sm text-gray-700 italic">"{recipe.magic_spice_reasoning}"</p>
                    </div>
                )}

                {/* Stats / Reasoning */}
                {recipe.health_reasoning && (
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100 flex gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{recipe.health_reasoning}</p>
                    </div>
                )}

                <button
                    onClick={onReset}
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                    Cook Something Else
                </button>
            </div>
        </div>
    );
}
