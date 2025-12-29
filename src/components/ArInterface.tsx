"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, Search, BarChart2, HelpCircle, Loader2, ShoppingCart } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { analyzeImage, generateRecipe } from "@/app/actions";
import { Ingredient, Recipe } from "@/lib/types";
import RecipeDisplay from "./RecipeDisplay";

// Emoji mapping for common ingredients
const INGREDIENT_EMOJIS: Record<string, string> = {
    eggs: "🥚", egg: "🥚",
    milk: "🥛",
    spinach: "🥬", lettuce: "🥬", greens: "🥬",
    carrot: "🥕", carrots: "🥕",
    tomato: "🍅", tomatoes: "🍅",
    apple: "🍎", apples: "🍎",
    orange: "🍊", oranges: "🍊",
    banana: "🍌", bananas: "🍌",
    cheese: "🧀",
    bread: "🍞",
    butter: "🧈",
    chicken: "🍗",
    meat: "🥩", beef: "🥩", steak: "🥩",
    fish: "🐟", salmon: "🐟",
    broccoli: "🥦",
    pepper: "🌶️", peppers: "🌶️",
    onion: "🧅", onions: "🧅",
    garlic: "🧄",
    potato: "🥔", potatoes: "🥔",
    cucumber: "🥒", cucumbers: "🥒",
    avocado: "🥑",
    lemon: "🍋", lemons: "🍋",
    strawberry: "🍓", strawberries: "🍓",
    grapes: "🍇",
    watermelon: "🍉",
    corn: "🌽",
    mushroom: "🍄", mushrooms: "🍄",
    edamame: "🫛", beans: "🫛", peas: "🫛",
    yogurt: "🥛",
    juice: "🧃",
    water: "💧",
    default: "🍽️"
};

function getIngredientEmoji(name: string): string {
    const lowerName = name.toLowerCase();
    for (const [key, emoji] of Object.entries(INGREDIENT_EMOJIS)) {
        if (lowerName.includes(key)) return emoji;
    }
    return INGREDIENT_EMOJIS.default;
}

export default function ArInterface() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isCameraLoading, setIsCameraLoading] = useState(false);

    // State for ingredients and recipes
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recipesGenerated, setRecipesGenerated] = useState(0);

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // Start camera
    const startCamera = useCallback(async (): Promise<boolean> => {
        if (isCameraActive && streamRef.current) return true;

        setError(null);
        setIsCameraLoading(true);

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API not available");
            }

            let mediaStream: MediaStream | null = null;

            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false
                });
            } catch {
                mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }

            if (!mediaStream) throw new Error("Could not access camera");

            streamRef.current = mediaStream;

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await new Promise<void>((resolve) => {
                    const video = videoRef.current!;
                    video.onloadedmetadata = () => resolve();
                    setTimeout(resolve, 3000);
                });
                try { await videoRef.current.play(); } catch { }
            }

            setIsCameraActive(true);
            setIsCameraLoading(false);
            return true;
        } catch (err: unknown) {
            setIsCameraLoading(false);
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Camera error: ${msg}`);
            return false;
        }
    }, [isCameraActive]);

    // Capture image
    const captureImage = useCallback((): string | null => {
        if (!videoRef.current || !canvasRef.current) return null;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.8);
    }, []);

    // Handle capture
    const handleCapture = async () => {
        setError(null);
        if (!isCameraActive) {
            const started = await startCamera();
            if (!started) return;
            await new Promise(r => setTimeout(r, 500));
        }
        const base64Image = captureImage();
        if (!base64Image) {
            setError("Failed to capture. Enable camera first.");
            return;
        }
        setIsAnalyzing(true);
        try {
            const result = await analyzeImage(base64Image);
            if (result.error) setError(result.error);
            else setIngredients(result.ingredients);
        } catch { setError("Failed to analyze image."); }
        finally { setIsAnalyzing(false); }
    };

    // Generate recipe
    const handleGenerateRecipe = async () => {
        if (ingredients.length === 0) {
            setError("Scan ingredients first!");
            return;
        }
        setError(null);
        setIsGenerating(true);
        try {
            const result = await generateRecipe(ingredients);
            if (result.error) setError(result.error);
            else if (result.recipe) {
                setRecipe(result.recipe);
                setRecipesGenerated(prev => prev + 1);
            }
        } catch { setError("Failed to generate recipe."); }
        finally { setIsGenerating(false); }
    };

    const handleReset = () => {
        setRecipe(null);
        setIngredients([]);
    };

    const healthScore = recipe?.health_score || 8;
    const wasteSaved = ingredients.length > 0 ? Math.min(95, 20 + ingredients.length * 8) : 32;

    return (
        <div className="relative h-[100dvh] w-full overflow-hidden bg-[#f5f0e8] text-gray-900 font-sans">
            <canvas ref={canvasRef} className="hidden" />

            {/* Camera Feed */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Fallback if no camera */}
            {!isCameraActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#e8e0d0] via-[#d8d0c0] to-[#c8c0b0] flex items-center justify-center">
                    <button
                        onClick={startCamera}
                        disabled={isCameraLoading}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="w-24 h-24 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
                            {isCameraLoading ? (
                                <Loader2 className="w-10 h-10 text-gray-600 animate-spin" />
                            ) : (
                                <Camera className="w-10 h-10 text-gray-700" />
                            )}
                        </div>
                        <p className="text-gray-600 font-medium">
                            {isCameraLoading ? "Starting..." : "Tap to enable camera"}
                        </p>
                    </button>
                </div>
            )}

            {/* Circular Scanning Frame */}
            {isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-56 h-56">
                        {/* Outer ring */}
                        <div className={clsx(
                            "absolute inset-0 rounded-full border-4 border-white/60",
                            isAnalyzing && "animate-pulse"
                        )} />
                        {/* Inner glow ring */}
                        <div className="absolute inset-4 rounded-full border-2 border-yellow-300/60" />
                        {/* Center dot */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={clsx(
                                "w-4 h-4 rounded-full",
                                isAnalyzing ? "bg-yellow-400 animate-ping" : "bg-yellow-300/80"
                            )} />
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Ingredient Tags */}
            {ingredients.length > 0 && (
                <div className="absolute top-20 left-0 right-0 px-4 pointer-events-none">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {ingredients.slice(0, 6).map((ing, i) => (
                            <div
                                key={ing.name}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-full shadow-lg",
                                    ing.expiry_status === "fresh" ? "bg-[#a8d5a2]" :
                                        ing.expiry_status === "soon" ? "bg-[#f0e68c]" : "bg-[#e8d8a0]"
                                )}
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <span className="text-lg">{getIngredientEmoji(ing.name)}</span>
                                <span className="text-sm font-semibold text-gray-800">{ing.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div className="absolute top-4 left-4 right-4 z-50 bg-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium shadow-lg">
                    {error}
                    <button onClick={() => setError(null)} className="float-right font-bold">×</button>
                </div>
            )}

            {/* Recipe Overlay */}
            {recipe && (
                <div className="absolute inset-0 z-50 bg-white/95 overflow-y-auto p-4 pt-12" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <button
                        onClick={() => setRecipe(null)}
                        className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full"
                    >
                        ✕
                    </button>
                    <RecipeDisplay recipe={recipe} onReset={handleReset} />
                </div>
            )}

            {/* Bottom Panel */}
            <div className="absolute bottom-0 w-full z-20">

                {/* Instamart Section */}
                <div className="mx-4 mb-3 bg-white rounded-2xl p-3 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-gray-800">Instamart</span>
                        <span className="text-xs text-gray-500 ml-auto">Order missing ingredients</span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find recipes using Instamart..."
                            className="w-full h-10 rounded-xl bg-gray-100 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                            onFocus={handleGenerateRecipe}
                        />
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="flex gap-2 mx-4 mb-3">
                    <Link href="/your-data" className="flex-1 bg-[#d4f0e8] rounded-2xl p-3 shadow-md">
                        <p className="text-[10px] text-gray-600 font-medium">Health Score</p>
                        <p className="text-2xl font-black text-gray-800">{healthScore}/10</p>
                        <div className="flex gap-0.5 mt-1">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className={clsx(
                                    "h-1 flex-1 rounded-full",
                                    i < healthScore ? "bg-emerald-500" : "bg-gray-300"
                                )} />
                            ))}
                        </div>
                    </Link>
                    <div className="flex-1 bg-[#e8f5e0] rounded-2xl p-3 shadow-md">
                        <p className="text-[10px] text-gray-600 font-medium">Food Waste</p>
                        <p className="text-2xl font-black text-gray-800">{wasteSaved}%</p>
                        <p className="text-[10px] text-emerald-600 font-medium mt-1">Saved this week 🌱</p>
                    </div>
                    <div className="flex-1 bg-[#fce8d8] rounded-2xl p-3 shadow-md">
                        <p className="text-[10px] text-gray-600 font-medium">Recipes</p>
                        <p className="text-2xl font-black text-gray-800">{recipesGenerated}</p>
                        <p className="text-[10px] text-orange-600 font-medium mt-1">Generated 😊</p>
                    </div>
                </div>

                {/* Bottom Navigation */}
                <div className="bg-white rounded-t-3xl shadow-lg">
                    <div className="flex justify-around items-center py-3 px-4">
                        <NavItem icon={<Camera className="w-5 h-5" />} label="Camera" active href="/" />
                        <NavItem icon={<Search className="w-5 h-5" />} label="Search" href="/search" />

                        {/* Center Capture Button */}
                        <button
                            onClick={handleCapture}
                            disabled={isAnalyzing}
                            className="relative -mt-8"
                        >
                            <div className={clsx(
                                "w-16 h-16 rounded-full bg-white border-4 border-gray-200 shadow-xl flex items-center justify-center",
                                isAnalyzing && "animate-pulse"
                            )}>
                                {isAnalyzing ? (
                                    <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                                        <Camera className="w-5 h-5 text-white" />
                                    </div>
                                )}
                            </div>
                        </button>

                        <NavItem icon={<BarChart2 className="w-5 h-5" />} label="Your Data" href="/your-data" />
                        <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Help" href="/help" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavItem({ icon, label, active, href }: { icon: React.ReactNode; label: string; active?: boolean; href: string }) {
    return (
        <Link
            href={href}
            className={clsx(
                "flex flex-col items-center gap-1 p-2 rounded-xl",
                active ? "text-emerald-600" : "text-gray-500"
            )}
        >
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
        </Link>
    );
}
