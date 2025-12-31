"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, ArrowLeft, ChefHat, Clock, Flame, Sparkles, TrendingUp, Camera, BarChart2, HelpCircle, X, Loader2 } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { getHistoryAction, generateRecipeByName, saveRecipeAction } from "@/app/actions";
import { Recipe } from "@/lib/types";
import RecipeDisplay from "@/components/RecipeDisplay";

const POPULAR_SEARCHES = [
    { name: "Quick Breakfast", icon: "🍳", time: "15 min", color: "bg-[#fce8d8]" },
    { name: "Healthy Lunch", icon: "🥗", time: "25 min", color: "bg-[#d4f0e8]" },
    { name: "Easy Dinner", icon: "🍝", time: "30 min", color: "bg-[#e8d8f0]" },
    { name: "Smoothie Bowl", icon: "🫐", time: "5 min", color: "bg-[#d8e8f0]" },
    { name: "Protein Rich", icon: "💪", time: "20 min", color: "bg-[#f0e8d8]" },
    { name: "Vegetarian", icon: "🥬", time: "25 min", color: "bg-[#e8f5e0]" },
];

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

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [history, setHistory] = useState<{ recipe: Recipe; date: string }[]>([]);
    const [results, setResults] = useState<{ recipe: Recipe; date: string }[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedTools, setSelectedTools] = useState<string[]>([]);

    // Handle back button to go to camera page
    useEffect(() => {
        const handlePopState = () => {
            router.replace('/');
        };
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [router]);

    const handleGenerate = async () => {
        if (!query.trim()) return;
        setIsGenerating(true);
        try {
            const result = await generateRecipeByName(query, selectedTools);
            if (result.recipe) {
                // Save to history
                await saveRecipeAction(result.recipe);
                // Update local history display
                setHistory(prev => [{ recipe: result.recipe!, date: new Date().toISOString() }, ...prev]);
                // Select for display
                setSelectedRecipe(result.recipe);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Load history on mount
    useEffect(() => {
        getHistoryAction()
            .then(setHistory)
            .catch(console.error);
    }, []);

    // Filter results when query changes
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const q = query.toLowerCase();
        const filtered = history.filter(item =>
            item.recipe.title.toLowerCase().includes(q) ||
            item.recipe.ingredients.some(ing => ing.toLowerCase().includes(q))
        );
        setResults(filtered);
    }, [query, history]);

    return (
        <div className="min-h-[100dvh] bg-[#f5f0e8] text-gray-900 flex flex-col relative">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
                <div className="flex items-center gap-4 p-4">
                    <Link href="/" className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </Link>
                    <div className="flex-1 relative group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-emerald-500" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search your recipes..."
                            autoFocus
                            className="w-full h-12 rounded-xl bg-gray-100 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:bg-white transition-all duration-200"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>


                {/* Equipment Filter */}
                <div className="px-4 pb-4 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2">
                        {["Stove", "Oven", "Microwave", "Kettle", "Blender", "Air Fryer"].map((tool) => (
                            <button
                                key={tool}
                                onClick={() => {
                                    if (selectedTools.includes(tool)) {
                                        setSelectedTools(selectedTools.filter(t => t !== tool));
                                    } else {
                                        setSelectedTools([...selectedTools, tool]);
                                    }
                                }}
                                className={clsx(
                                    "px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                                    selectedTools.includes(tool)
                                        ? "bg-gray-800 text-white border-gray-800 shadow-md"
                                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                )}
                            >
                                {tool}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 space-y-6 pb-24 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>

                {/* Real Search Results */}
                {query.trim().length > 0 ? (
                    <div>
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <SearchIcon className="w-4 h-4" />
                            Results ({results.length})
                        </h2>
                        {results.length > 0 ? (
                            <div className="space-y-3">
                                {results.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedRecipe(item.recipe)}
                                        className="flex items-center gap-4 w-full p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 text-left"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl shrink-0">
                                            🍽️
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-800 truncate">{item.recipe.title}</div>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {new Date(item.date).toLocaleDateString()}
                                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                <span className={clsx(
                                                    "font-medium",
                                                    item.recipe.health_score >= 8 ? "text-emerald-600" :
                                                        item.recipe.health_score >= 5 ? "text-amber-600" : "text-rose-600"
                                                )}>
                                                    Health: {item.recipe.health_score}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-center py-6 text-gray-500">
                                    <p>No recipes found in your history for "{query}"</p>
                                </div>

                                {/* AI Generation Card */}
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                                <Sparkles className="w-5 h-5 text-yellow-300" />
                                            </div>
                                            <h3 className="font-bold text-lg">Create New Recipe</h3>
                                        </div>
                                        <p className="text-indigo-100 mb-6 max-w-[90%] text-sm leading-relaxed">
                                            Want the AI chef to invent a brand new recipe for <strong>"{query}"</strong>?
                                        </p>

                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating}
                                            className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-lg shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Creating Magic...
                                                </>
                                            ) : (
                                                <>
                                                    ✨ Generate "{query}"
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Decorative background */}
                                    <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                                    <div className="absolute bottom-[-50%] left-[-10%] w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Default View (No Query) */
                    <>
                        {/* Trending Banner */}
                        <div className="bg-gradient-to-r from-[#d4f0e8] via-[#e8f5e0] to-[#d4f0e8] rounded-2xl p-4 border border-emerald-200/50 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-500 rounded-xl shadow-md">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-emerald-700">Trending Now</h3>
                                    <p className="text-sm text-gray-600">Winter comfort food recipes are hot! 🔥</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent History (Fallback) */}
                        {history.length > 0 && (
                            <div>
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Your Recent Generation
                                </h2>
                                <div className="space-y-2">
                                    {history.map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedRecipe(item.recipe)}
                                            className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 text-left group shadow-sm border border-gray-100"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <Clock className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                                            </div>
                                            <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{item.recipe.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Popular Categories */}
                        <div>
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Popular Categories
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {POPULAR_SEARCHES.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setQuery(item.name)}
                                        className={clsx(
                                            "flex items-center gap-3 p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] group",
                                            item.color
                                        )}
                                        style={{ animationDelay: `${i * 50}ms` }}
                                    >
                                        <span className="text-3xl transform group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                                        <div className="text-left">
                                            <div className="font-bold text-gray-800">{item.name}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                                <Flame className="w-3 h-3 text-orange-500" />
                                                {item.time}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pro Tip */}
                        <div className="bg-gradient-to-r from-[#d4f0e8] via-[#e8f5e0] to-[#d4f0e8] border border-emerald-200/50 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
                                    <ChefHat className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-emerald-700 text-lg">Pro Tip</h3>
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                        Use the camera to scan your fridge and get personalized recipe suggestions based on what you have!
                                    </p>
                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                                    >
                                        Try it now →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div >

            {/* Recipe Modal */}
            {
                selectedRecipe && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                        <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-transparent rounded-t-3xl sm:rounded-3xl shadow-2xl">
                            <button
                                onClick={() => setSelectedRecipe(null)}
                                className="absolute top-4 right-4 z-50 p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <RecipeDisplay recipe={selectedRecipe} onReset={() => setSelectedRecipe(null)} />
                        </div>
                    </div>
                )
            }


            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg border-t border-gray-100 z-30">
                <div className="flex justify-around items-center py-3 px-4">
                    <NavItem icon={<Camera className="w-5 h-5" />} label="Camera" href="/" />
                    <NavItem icon={<SearchIcon className="w-5 h-5" />} label="Search" active href="/search" />
                    <div className="w-16" /> {/* Spacer for center button */}
                    <NavItem icon={<BarChart2 className="w-5 h-5" />} label="Your Data" href="/your-data" />
                    <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Help" href="/help" />
                </div>
            </div>
        </div >
    );
}
