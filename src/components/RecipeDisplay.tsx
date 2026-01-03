import { Recipe, UserProfile } from "@/lib/types";
import { CheckCircle, AlertCircle, ChefHat, Sparkles, Star, Loader2, MapPin, Activity } from "lucide-react";
import clsx from "clsx";
import { useEffect, useState, useMemo } from "react";
import { searchYouTubeVideos, YouTubeVideo, getRegionalRecommendations } from "@/app/actions";
import { Globe } from "lucide-react";

interface RecipeDisplayProps {
    recipe: Recipe;
    onReset: () => void;
    userProfile: UserProfile | null;
}

export default function RecipeDisplay({ recipe, onReset, userProfile }: RecipeDisplayProps) {
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [loadingVideos, setLoadingVideos] = useState(true);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [regionalDishes, setRegionalDishes] = useState<string[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState(userProfile?.preferredLanguage || 'English');

    const LANGUAGES = [
        'English', 'Hindi', 'Tamil', 'Telugu', 'Gujarati',
        'Marathi', 'Bengali', 'Kannada', 'Malayalam', 'Punjabi'
    ];

    useEffect(() => {
        async function fetchData() {
            setLoadingVideos(true);
            setVideoError(null);

            // Fetch YouTube Videos with language preference and health restrictions
            const query = recipe.youtube_search_query || recipe.title;
            const result = await searchYouTubeVideos(query, 2, selectedLanguage, recipe.restricted_ingredients || []);

            if (result.error) {
                setVideoError(result.error);
            }
            setVideos(result.videos);
            setLoadingVideos(false);

            // Fetch Regional Recommendations (only on mount or profile change)
            if (userProfile?.state) {
                const dishes = await getRegionalRecommendations(userProfile.state);
                setRegionalDishes(dishes);
            }
        }
        fetchData();
    }, [recipe, userProfile?.state, selectedLanguage]);

    const getHealthColor = (score: number) => {
        if (score >= 8) return "from-green-500/20 to-emerald-500/30 text-green-300 border-green-500/30";
        if (score >= 5) return "from-yellow-500/20 to-amber-500/30 text-yellow-300 border-yellow-500/30";
        return "from-red-500/20 to-rose-500/30 text-red-300 border-red-500/30";
    };

    return (
        <div className="bg-gradient-to-b from-gray-900/95 to-gray-950/95 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 border border-white/10">
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-emerald-600/20 via-teal-500/20 to-cyan-500/20 p-6 border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-transparent to-cyan-400/5" />
                <div className="relative flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                        <ChefHat className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{recipe.title}</h2>
                                <p className="text-sm text-emerald-300/80 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4" />
                                    AI Chef's Recommendation
                                </p>
                            </div>

                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 backdrop-blur-md">
                                <Globe className="w-4 h-4 text-emerald-400" />
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value as any)}
                                    className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer pr-1"
                                >
                                    {LANGUAGES.map(lang => (
                                        <option key={lang} value={lang} className="bg-gray-900 border-none">
                                            {lang}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className={clsx(
                        "px-4 py-3 rounded-2xl border flex flex-col items-center justify-center bg-gradient-to-br backdrop-blur-sm",
                        getHealthColor(recipe.health_score)
                    )}>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Health</span>
                        <span className="text-3xl font-black">{recipe.health_score}<span className="text-lg opacity-60">/10</span></span>
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
                        <div className="absolute top-2 right-4 text-amber-400/30 animate-pulse">✦</div>
                        <div className="absolute bottom-3 right-8 text-orange-400/20 animate-pulse" style={{ animationDelay: '500ms' }}>✦</div>
                        <div className="relative">
                            <h3 className="text-sm font-bold uppercase text-amber-400 tracking-wider mb-3 flex items-center gap-2">
                                <Star className="w-4 h-4 fill-amber-400" />
                                Magic Spice Suggestion
                            </h3>
                            <p className="text-xl font-bold text-white mb-2">{recipe.magic_spice}</p>
                            <p className="text-sm text-amber-200/70 italic leading-relaxed">"{recipe.magic_spice_reasoning}"</p>
                        </div>
                    </div>
                )}

                {/* Health Reasoning */}
                {recipe.health_reasoning && (
                    <div className="bg-blue-500/10 text-blue-200 p-4 rounded-2xl text-sm border border-blue-500/20 flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="leading-relaxed pt-1">{recipe.health_reasoning}</p>
                    </div>
                )}

                {/* Regional Recommendations */}
                {regionalDishes.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 rounded-3xl border border-indigo-500/20">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-indigo-400" />
                            Famous Dishes from {userProfile?.state}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {regionalDishes.map((dish, i) => (
                                <span
                                    key={i}
                                    className="px-4 py-2 bg-indigo-500/20 text-indigo-200 rounded-full text-sm font-medium border border-indigo-500/30 animate-in zoom-in-95 duration-300"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    {dish}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Video Tutorials */}
                <div>
                    {userProfile?.healthConditions && userProfile.healthConditions.length > 0 && (
                        <div className="mb-4 px-1 flex items-center gap-2 text-rose-300/80 text-sm font-medium animate-in fade-in slide-in-from-left-4 duration-500">
                            <Activity className="w-4 h-4" />
                            <span>This recipe is prepared for people with: {userProfile.healthConditions.join(", ")}</span>
                        </div>
                    )}
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                        <span className="w-1.5 h-7 bg-gradient-to-b from-red-500 to-pink-600 rounded-full"></span>
                        Video Tutorials ({selectedLanguage})
                    </h3>

                    {loadingVideos ? (
                        <div className="flex items-center justify-center py-12 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Loading videos...
                        </div>
                    ) : videoError ? (
                        <div className="text-center py-8 text-gray-500 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-sm">Video tutorials not available</p>
                            <p className="text-xs mt-1 opacity-60">{videoError}</p>
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-sm">No video tutorials found for this recipe</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {videos.map((video) => (
                                <div
                                    key={video.videoId}
                                    className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black"
                                >
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${video.videoId}`}
                                        title={video.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <button
                    onClick={onReset}
                    className="w-full py-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-white/5 active:scale-[0.98] border border-white/10"
                >
                    Cook Something Else
                </button>
            </div>
        </div>
    );
}
