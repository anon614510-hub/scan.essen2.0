"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import CameraCapture from "@/components/CameraCapture";
import Filters from "@/components/Filters";
import { ChefHat, AlertTriangle, Info } from "lucide-react";
import { identifyIngredients, generateRecipe } from "@/app/actions";
import { Recipe, Ingredient } from "@/lib/types";
import RecipeDisplay from "@/components/RecipeDisplay";
import LoadingSpinner from "@/components/LoadingSpinner";
import clsx from "clsx";

export default function Home() {
  const [image, setImage] = useState<string>("");
  const [imageSrc, setImageSrc] = useState<"upload" | "camera">("upload");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  // Filters State
  const [cuisine, setCuisine] = useState("Any");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [expiringIngredients, setExpiringIngredients] = useState<Ingredient[]>([]);

  const handleAnalyze = async () => {
    if (!image) return;

    setLoading(true);
    setExpiringIngredients([]);

    try {
      // Step 1: Vision
      setLoadingStep("Identifying ingredients & checking freshness...");
      const ingredients = await identifyIngredients(image);

      if (ingredients.length === 0) {
        alert("No ingredients found! Try a clearer photo.");
        setLoading(false);
        return;
      }

      // Filter expiring items
      const expiring = ingredients.filter(i => i.expiry_status === "soon" || i.expiry_status === "expired");
      setExpiringIngredients(expiring);

      // Step 2: Recipe
      setLoadingStep(`Found ${ingredients.length} ingredients. Creating ${cuisine} recipe...`);
      const generatedRecipe = await generateRecipe(ingredients, cuisine, equipment);
      setRecipe(generatedRecipe);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Something went wrong. Please check your server logs or API key.");
    } finally {
      setLoading(false);
    }
  };

  if (recipe) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
        {expiringIngredients.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm">
            <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Use These Soon!
            </h3>
            <ul className="space-y-2">
              {expiringIngredients.map((item, idx) => (
                <li key={idx} className="bg-white p-2 rounded-lg border border-red-100 flex justify-between items-center text-sm">
                  <span className="font-medium text-red-900">{item.name}</span>
                  <span className="text-red-600 italic text-xs bg-red-50 px-2 py-1 rounded-full">{item.expiry_reasoning || "Expiring soon"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <RecipeDisplay recipe={recipe} onReset={() => {
          setRecipe(null);
          setImage("");
        }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <header className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-primary to-emerald-600 text-white rounded-2xl shadow-lg mb-4 rotate-3 transform hover:rotate-6 transition-transform">
          <ChefHat className="w-9 h-9" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
          FridgeForager
        </h1>
        <p className="text-lg text-gray-600">
          Upload a photo, clear your fridge, eat delicious food.
        </p>
      </header>

      {/* Missing API Key Warning (Client-side check not possible easily securely, but good for UX if server fails) */}

      <section className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 transition-all duration-300">
        {loading ? (
          <LoadingSpinner message={loadingStep} />
        ) : (
          <div className="flex flex-col gap-6">
            <Filters
              cuisine={cuisine}
              setCuisine={setCuisine}
              equipment={equipment}
              setEquipment={setEquipment}
            />

            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                1. Snap your fridge
              </h2>

              <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
                <button
                  onClick={() => setImageSrc("upload")}
                  className={clsx(
                    "flex-1 py-2 rounded-lg font-medium text-sm transition-all shadow-sm",
                    imageSrc === "upload" ? "bg-white text-gray-900 shadow" : "bg-transparent text-gray-500 hover:text-gray-700 shadow-none"
                  )}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setImageSrc("camera")}
                  className={clsx(
                    "flex-1 py-2 rounded-lg font-medium text-sm transition-all",
                    imageSrc === "camera" ? "bg-white text-gray-900 shadow" : "bg-transparent text-gray-500 hover:text-gray-700 shadow-none"
                  )}
                >
                  Use Camera
                </button>
              </div>

              {imageSrc === "upload" ? (
                <ImageUpload onImageSelected={(img) => setImage(img)} />
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center min-h-[200px] bg-gray-50 hover:bg-gray-100 transition-colors">
                  <CameraCapture onImageSelected={(img) => setImage(img)} />
                  {image && <p className="mt-4 text-green-600 font-medium flex items-center gap-2">
                    <Info className="w-4 h-4" /> Image Captured!
                  </p>}
                </div>
              )}
            </div>

            {image && (
              <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 pt-2">
                <button
                  onClick={handleAnalyze}
                  className="w-full sm:w-auto px-10 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-lg"
                >
                  <ChefHat className="w-6 h-6" />
                  Find Me a Recipe
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
