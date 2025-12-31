"use client";

import { Recipe } from "@/lib/types";
import { CheckCircle, AlertCircle, ChefHat, Sparkles, Star, Youtube, Image as ImageIcon } from "lucide-react";
import clsx from "clsx";

interface RecipeDisplayProps {
    recipe: Recipe;
    onReset: () => void;
}

export default function RecipeDisplay({ recipe, onReset }: RecipeDisplayProps) {
    const getHealthColor = (score: number) => {
        if (score >= 8) return "from-green-500/20 to-emerald-500/30 text-green-300 border-green-500/30";
        if (score >= 5) return "from-yellow-500/20 to-amber-500/30 text-yellow-300 border-yellow-500/30";
        return "from-red-500/20 to-rose-500/30 text-red-300 border-red-500/30";
    };

    const getHealthBadge = (score: number) => {
        if (score >= 8) return "bg-gradient-to-r from-green-500 to-emerald-500";
        if (score >= 5) return "bg-gradient-to-r from-yellow-500 to-amber-500";
        return "bg-gradient-to-r from-red-500 to-rose-500";
    };

    return (
        <div className="bg-gradient-to-b from-gray-900/95 to-gray-950/95 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 border border-white/10">
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-emerald-600/20 via-teal-500/20 to-cyan-500/20 p-6 border-b border-white/10">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-transparent to-cyan-400/5" />

                <div className="relative flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                        <ChefHat className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-1">{recipe.title}</h2>
                        <p className="text-sm text-emerald-300/80 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            AI Chef's Recommendation
                        </p>
                    </div>
                    <div className={clsx(
                        "px-3 py-2 rounded-xl border flex flex-col items-center justify-center bg-gradient-to-br backdrop-blur-sm shadow-inner",
                        getHealthColor(recipe.health_score)
                    )}>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Health</span>
                        <span className="text-2xl font-black">{recipe.health_score}<span className="text-sm opacity-60">/10</span></span>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* Ingredients */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                        <span className="w-1.5 h-7 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full"></span>
                        Ingredients
                    </h3>
                    <ul className="grid sm:grid-cols-2 gap-2.5">
                        {recipe.ingredients.map((ing, i) => (
                            <li
                                key={i}
                                className="flex items-center gap-3 text-gray-200 bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 transition-all duration-200 hover:border-white/10 animate-in fade-in duration-300"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="text-sm">{ing}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Instructions */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                        <span className="w-1.5 h-7 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full"></span>
                        Instructions
                    </h3>
                    <div className="space-y-4">
                        {recipe.instructions.map((step, i) => (
                            <div
                                key={i}
                                className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300"
                                style={{ animationDelay: `${(recipe.ingredients.length + i) * 50}ms` }}
                            >
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-blue-500/20">
                                    {i + 1}
                                </div>
                                <p className="text-gray-300 pt-2 leading-relaxed text-sm">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Magic Spice */}
                {recipe.magic_spice && (
                    <div className="relative bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-rose-500/10 p-5 rounded-2xl border border-orange-500/20 overflow-hidden">
                        {/* Sparkle decorations */}
                        <div className="absolute top-2 right-4 text-amber-400/30 animate-pulse">✦</div>
                        <div className="absolute bottom-3 right-8 text-orange-400/20 animate-pulse" style={{ animationDelay: '500ms' }}>✦</div>

                        <div className="relative">
                            <h3 className="text-sm font-bold uppercase text-amber-400 tracking-wider mb-3 flex items-center gap-2">
                                <Star className="w-4 h-4 fill-amber-400" />
                                Magic Spice Suggestion
                            </h3>
                            <p className="text-xl font-bold text-white mb-1">{recipe.magic_spice}</p>
                            <p className="text-sm text-amber-200/70 italic leading-relaxed">"{recipe.magic_spice_reasoning}"</p>
                        </div>
                    </div>
                )}

                {/* Health Reasoning */}
                {recipe.health_reasoning && (
                    <div className="bg-blue-500/5 text-blue-200/80 p-4 rounded-2xl text-xs border border-blue-500/10 flex gap-3 italic">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="leading-relaxed pt-1">{recipe.health_reasoning}</p>
                    </div>
                )}

                <div className="border-t border-white/10 pt-8 mt-4 space-y-8">
                    {/* Cooking Tutorials */}
                    {recipe.youtube_urls && recipe.youtube_urls.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                <span className="w-1.5 h-7 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                                Cooking Tutorials
                            </h3>
                            <div className="grid gap-3">
                                {recipe.youtube_urls.slice(0, 3).map((url, i) => (
                                    <a
                                        key={i}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative flex items-center gap-4 p-4 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-2xl transition-all duration-300 active:scale-[0.98]"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-red-500/10">
                                            <Youtube className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                                                {i === 0 ? "Standard Recipe Video" : i === 1 ? "Step-by-Step Guide" : "Quick Tutorial"}
                                            </p>
                                            <p className="text-[11px] text-gray-400">Watch on YouTube</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-red-500 transition-all duration-300">
                                            <Sparkles className="w-3 h-3" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cooking Vlogs (Shorts/Videos) */}
                    {recipe.vlog_urls && recipe.vlog_urls.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                <span className="w-1.5 h-7 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
                                Short Cooking Vlogs (60-90s)
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                                {recipe.vlog_urls.slice(0, 5).map((url, i) => (
                                    <a
                                        key={i}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative aspect-[9/16] w-full rounded-2xl overflow-hidden border border-white/10 bg-gray-800 shadow-2xl transition-all duration-300 hover:scale-[1.05] hover:border-amber-500/50 hover:shadow-amber-500/20"
                                    >
                                        {/* Thumbnail Placeholder with Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                                        <img
                                            src={`https://loremflickr.com/400/700/cooking,${recipe.title.split(' ')[0]},food/all?lock=${i + 15}`}
                                            alt="Vlog thumbnail"
                                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                                        />

                                        {/* Play Button Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center z-20">
                                            <div className="w-10 h-10 rounded-full bg-amber-500/90 flex items-center justify-center shadow-lg shadow-amber-500/40 group-hover:scale-125 transition-transform duration-300">
                                                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[12px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                                            </div>
                                        </div>

                                        {/* Duration Badge */}
                                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-md text-[9px] font-bold text-white z-20 border border-white/10">
                                            {i % 2 === 0 ? "0:60" : "0:90"}
                                        </div>

                                        {/* Title/Label */}
                                        <div className="absolute bottom-3 left-3 right-3 z-20">
                                            <p className="text-[10px] font-bold text-white line-clamp-2 leading-tight">
                                                {i === 0 ? "Quick " + recipe.title : i === 1 ? "Cooking Vlog" : i === 2 ? "Chef Style" : i === 3 ? "Easy Version" : "Pro Tips"}
                                            </p>
                                            <p className="text-[8px] text-amber-400 font-medium mt-0.5">Watch Reel</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4">
                    <button
                        onClick={onReset}
                        className="w-full py-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-white/5 active:scale-[0.98] border border-white/10 flex items-center justify-center gap-2"
                    >
                        <ChefHat className="w-5 h-5" />
                        Cook Something Else
                    </button>
                </div>
            </div>
        </div>
    );
}
