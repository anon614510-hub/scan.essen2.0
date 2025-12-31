"use client";

import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from "react";
import { Camera, Search, BarChart2, HelpCircle, Loader2, ShoppingCart, Mic, MicOff, ChefHat } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { analyzeImage, generateRecipe } from "@/app/actions";
import { Ingredient, Recipe } from "@/lib/types";
import RecipeDisplay from "./RecipeDisplay";

// Emoji mapping for common ingredients and food items
const INGREDIENT_EMOJIS: Record<string, string> = {
    // Proteins
    eggs: "🥚", egg: "🥚",
    chicken: "🍗", turkey: "🍗",
    meat: "🥩", beef: "🥩", steak: "🥩", pork: "🥩",
    fish: "🐟", salmon: "🐟", tuna: "🐟", shrimp: "🦐", prawn: "🦐",
    bacon: "🥓",

    // Dairy
    milk: "🥛", yogurt: "🥛", cream: "🥛",
    cheese: "🧀",
    butter: "🧈",
    ice: "🍦", icecream: "🍦",

    // Vegetables
    spinach: "🥬", lettuce: "🥬", greens: "🥬", salad: "🥗",
    carrot: "🥕", carrots: "🥕",
    tomato: "🍅", tomatoes: "🍅",
    broccoli: "🥦",
    pepper: "🌶️", peppers: "🌶️", chili: "🌶️",
    onion: "🧅", onions: "🧅",
    garlic: "🧄",
    potato: "🥔", potatoes: "🥔", fries: "🍟",
    cucumber: "🥒", cucumbers: "🥒",
    avocado: "🥑",
    corn: "🌽",
    mushroom: "🍄", mushrooms: "🍄",
    edamame: "🫛", beans: "🫛", peas: "🫛",
    eggplant: "🍆",

    // Fruits
    apple: "🍎", apples: "🍎",
    orange: "🍊", oranges: "🍊",
    banana: "🍌", bananas: "🍌",
    lemon: "🍋", lemons: "🍋", lime: "🍋",
    strawberry: "🍓", strawberries: "🍓", berry: "🍓",
    grapes: "🍇", grape: "🍇",
    watermelon: "🍉", melon: "🍈",
    peach: "🍑", mango: "🥭", pineapple: "🍍",
    cherry: "🍒", cherries: "🍒",
    coconut: "🥥", kiwi: "🥝",

    // Bread & Grains
    bread: "🍞", toast: "🍞", loaf: "🍞",
    rice: "🍚", noodle: "🍜", pasta: "🍝", spaghetti: "🍝",
    pizza: "🍕",
    sandwich: "🥪", burger: "🍔", hotdog: "🌭",
    taco: "🌮", burrito: "🌯",
    croissant: "🥐", bagel: "🥯", pretzel: "🥨",
    pancake: "🥞", waffle: "🧇",

    // Snacks & Packaged
    chips: "🍿", popcorn: "🍿", crisp: "🍿",
    cookie: "🍪", cookies: "🍪", biscuit: "🍪",
    cake: "🍰", pie: "🥧", cupcake: "🧁",
    chocolate: "🍫", candy: "🍬", lollipop: "🍭",
    donut: "🍩", doughnut: "🍩",

    // Beverages
    juice: "🧃", smoothie: "🧃",
    water: "💧", bottle: "🍼",
    coffee: "☕", tea: "🍵",
    soda: "🥤", cola: "🥤", drink: "🥤", coke: "🥤",
    beer: "🍺", wine: "🍷",

    // Condiments & Others
    honey: "🍯",
    salt: "🧂",
    sauce: "🫙", ketchup: "🫙", mayo: "🫙",
    oil: "🫒", olive: "🫒",
    nut: "🥜", peanut: "🥜", almond: "🥜",

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
    const [isListening, setIsListening] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [recipesGenerated, setRecipesGenerated] = useState(0);
    const [showScanSuccess, setShowScanSuccess] = useState(false);
    const [newlyScannedItems, setNewlyScannedItems] = useState<string[]>([]);
    const [scanStatus, setScanStatus] = useState<string>("");

    // Voice Recognition Setup
    const startListening = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Voice recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            setIsListening(true);
            setVoiceTranscript("");
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setVoiceTranscript(transcript);
            handleGenerateWithVoice(transcript);
        };

        recognition.onerror = (event: any) => {
            setError(`Voice error: ${event.error}`);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    }, [ingredients]);

    const handleGenerateWithVoice = async (transcript: string) => {
        if (ingredients.length === 0) {
            setError("Scan ingredients first!");
            return;
        }
        setError(null);
        setIsGenerating(true);
        try {
            const result = await generateRecipe(ingredients, "Any", [], transcript);
            if (result.error) setError(result.error);
            else if (result.recipe) {
                setRecipe(result.recipe);
                setRecipesGenerated(prev => prev + 1);
            }
        } catch { setError("Failed to generate recipe."); }
        finally { setIsGenerating(false); }
    };

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
        setScanStatus("");
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
        setScanStatus("📸 Capturing image...");

        // Simulate progress messages
        const progressMessages = [
            "🔍 Analyzing with AI...",
            "🥗 Detecting ingredients...",
            "🧠 Processing image..."
        ];
        let msgIndex = 0;
        const progressInterval = setInterval(() => {
            msgIndex = (msgIndex + 1) % progressMessages.length;
            setScanStatus(progressMessages[msgIndex]);
        }, 2000);

        try {
            const result = await analyzeImage(base64Image);
            clearInterval(progressInterval);

            if (!result || typeof result !== 'object') {
                setScanStatus("");
                setError("Unexpected response. Please try again.");
                return;
            }

            if (result.error) {
                setScanStatus("");
                setError(result.error);
            } else if (!result.ingredients || !Array.isArray(result.ingredients) || result.ingredients.length === 0) {
                setScanStatus("");
                setError("🤔 No food detected! Try pointing at any edible items - snacks, drinks, cooked food, or packaged items.");
            } else {
                // Safely filter and validate ingredients
                const validIngredients = result.ingredients.filter((i): i is Ingredient =>
                    i && typeof i === 'object' && typeof i.name === 'string' && i.name.trim().length > 0
                );

                if (validIngredients.length === 0) {
                    setScanStatus("");
                    setError("🤔 Could not identify food items. Try again with better lighting.");
                    return;
                }

                setIngredients(validIngredients);
                setScanStatus(`✅ Found ${validIngredients.length} item${validIngredients.length > 1 ? 's' : ''}!`);
                setNewlyScannedItems(validIngredients.map((i: Ingredient) => i.name));
                setShowScanSuccess(true);

                // Automatically trigger recipe generation after a short delay for animation
                setTimeout(() => {
                    setShowScanSuccess(false);
                    setNewlyScannedItems([]);
                    setScanStatus("");
                    handleGenerateRecipe(validIngredients);
                }, 1500);
            }
        } catch (err) {
            console.error("Scan error:", err);
            clearInterval(progressInterval);
            setScanStatus("");
            setError("Failed to analyze image. Please try again.");
        }
        finally { setIsAnalyzing(false); }
    };

    // Generate recipe
    const handleGenerateRecipe = async (ingredientsToUse?: Ingredient[]) => {
        console.log("DEBUG: handleGenerateRecipe triggered!");
        const sourceIngredients = ingredientsToUse || ingredients;

        if (sourceIngredients.length === 0) {
            setError("Scan ingredients first!");
            return;
        }
        setError(null);
        setIsGenerating(true);
        try {
            const result = await generateRecipe(sourceIngredients, "Any", [], voiceTranscript);
            console.log("Recipe generation result:", result);
            if (result.error) {
                console.error("Recipe error:", result.error);
                setError(result.error);
            } else if (result.recipe) {
                console.log("Recipe received:", result.recipe.title);
                setRecipe(result.recipe);
                setRecipesGenerated(prev => prev + 1);
            } else {
                console.log("No recipe in result");
                setError("No recipe generated. Please try again.");
            }
        } catch (err) {
            console.error("Recipe generation error:", err);
            setError("Failed to generate recipe. Please try again.");
        }
        finally { setIsGenerating(false); }
    };

    const handleReset = () => {
        setRecipe(null);
        setIngredients([]);
        setVoiceTranscript("");
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
                    <div className="flex flex-col items-center gap-4">
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
                                {isCameraLoading ? "Starting camera..." : "Tap to enable camera"}
                            </p>
                        </button>
                        <p className="text-gray-500 text-sm text-center px-8">Scan any food - snacks, drinks, fruits, cooked meals, or packaged items</p>
                    </div>
                </div>
            )}

            {/* Circular Scanning Frame */}
            {isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-56 h-56">
                        {/* Outer ring */}
                        <div className={clsx(
                            "absolute inset-0 rounded-full border-4 transition-all duration-300",
                            showScanSuccess ? "border-green-400 scale-110" : "border-white/60",
                            isAnalyzing && "animate-pulse border-yellow-400"
                        )} />
                        {/* Inner glow ring */}
                        <div className={clsx(
                            "absolute inset-4 rounded-full border-2 transition-all duration-300",
                            showScanSuccess ? "border-green-300 scale-105" : "border-yellow-300/60"
                        )} />
                        {/* Center dot */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={clsx(
                                "w-4 h-4 rounded-full transition-all duration-300",
                                showScanSuccess ? "bg-green-500 scale-150" :
                                    isAnalyzing ? "bg-yellow-400 animate-ping" : "bg-yellow-300/80"
                            )} />
                        </div>

                        {/* Scanning laser effect */}
                        {isAnalyzing && (
                            <div className="absolute inset-0 overflow-hidden rounded-full">
                                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-line" />
                            </div>
                        )}
                    </div>

                    {/* Scan Status Message */}
                    {(scanStatus || isAnalyzing) && (
                        <div className="absolute top-full mt-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <div className="px-6 py-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg">
                                <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                    {isAnalyzing && !scanStatus.includes("✅") && (
                                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                    )}
                                    {scanStatus || "🔍 Analyzing..."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Scan Success Animation Overlay */}
            {showScanSuccess && (
                <div className="absolute inset-0 pointer-events-none z-30">
                    {/* Center burst effect */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-72 h-72 rounded-full bg-green-400/20 animate-ping-slow" />
                        <div className="absolute w-56 h-56 rounded-full bg-green-300/30 animate-ping-slower" />
                    </div>

                    {/* Particle effects */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 animate-particle"
                                style={{
                                    '--particle-angle': `${i * 30}deg`,
                                    animationDelay: `${i * 50}ms`,
                                } as React.CSSProperties}
                            />
                        ))}
                    </div>

                    {/* Success checkmark */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-bounce-in shadow-lg shadow-green-500/50">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Floating ingredient names */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {newlyScannedItems.slice(0, 6).map((item, i) => (
                            <div
                                key={item}
                                className="absolute px-4 py-2 bg-white/90 rounded-full shadow-lg font-semibold text-gray-800 animate-float-up"
                                style={{
                                    '--float-x': `${(i % 2 === 0 ? -1 : 1) * (20 + Math.random() * 60)}px`,
                                    '--float-delay': `${i * 150}ms`,
                                    animationDelay: `${i * 150}ms`,
                                } as React.CSSProperties}
                            >
                                <span className="mr-2">{getIngredientEmoji(item)}</span>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Floating Ingredient Tags */}
            {ingredients.length > 0 && !showScanSuccess && (
                <div className="absolute top-20 left-0 right-0 px-4 pointer-events-none">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {ingredients.slice(0, 6).map((ing, i) => (
                            <div
                                key={ing.name}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-full shadow-lg animate-ingredient-appear",
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

            {/* Loading Overlay for Recipe Generation */}
            {isGenerating && (
                <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
                            <ChefHat className="absolute inset-0 m-auto w-6 h-6 text-orange-500" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-gray-900">Creating Recipe...</h3>
                            <p className="text-sm text-gray-500 mt-1">Our AI chef is cooking something up</p>
                        </div>
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
                            placeholder={isListening ? "Listening..." : "Recipe preferences? (e.g. 'spicy', 'quick')"}
                            className={clsx(
                                "w-full h-10 rounded-xl bg-gray-100 pl-10 pr-12 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300",
                                isListening && "ring-2 ring-orange-400 animate-pulse"
                            )}
                            value={voiceTranscript}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVoiceTranscript(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleGenerateRecipe();
                                }
                            }}
                        />
                        <button
                            onClick={startListening}
                            disabled={isListening || isGenerating}
                            className={clsx(
                                "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors",
                                isListening ? "bg-orange-500 text-white" : "hover:bg-gray-200 text-gray-500"
                            )}
                        >
                            {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                        </button>
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

                        {/* Separate Search Button */}
                        <button
                            onClick={() => handleGenerateRecipe()}
                            disabled={isGenerating || ingredients.length === 0}
                            className={clsx(
                                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200",
                                ingredients.length > 0
                                    ? "text-orange-500 hover:bg-orange-50"
                                    : "text-gray-400"
                            )}
                        >
                            {isGenerating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Search className="w-5 h-5" />
                            )}
                            <span className="text-[10px] font-medium">Search</span>
                        </button>

                        {/* Center Capture Button */}
                        <button
                            onClick={handleCapture}
                            disabled={isAnalyzing}
                            className="relative -mt-8"
                        >
                            <div className={clsx(
                                "w-16 h-16 rounded-full bg-white border-4 shadow-xl flex items-center justify-center transition-all duration-300",
                                isAnalyzing ? "border-yellow-400 animate-pulse" :
                                    showScanSuccess ? "border-green-400" : "border-gray-200"
                            )}>
                                {isAnalyzing ? (
                                    <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                                ) : showScanSuccess ? (
                                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center animate-bounce-subtle">
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
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
