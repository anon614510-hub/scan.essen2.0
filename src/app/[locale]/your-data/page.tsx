"use client";

import { ArrowLeft, TrendingUp, Leaf, Clock, ChefHat, Apple, Trophy, Target, Zap, Camera, Search, BarChart2, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { getStatsAction, getHistoryAction } from "@/app/actions";
import { Recipe } from "@/lib/types";

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

export default function YourDataPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        healthScore: 0,
        recipesCooked: 0,
        ingredientsSaved: 0,
        wasteSaved: 0
    });
    const [history, setHistory] = useState<{ recipe: Recipe; date: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    // Handle back button to go to camera page
    useEffect(() => {
        const handlePopState = () => {
            router.replace('/');
        };
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [router]);

    // Load data
    useEffect(() => {
        async function loadData() {
            try {
                const [userStats, userHistory] = await Promise.all([
                    getStatsAction(),
                    getHistoryAction()
                ]);
                setStats(userStats);
                setHistory(userHistory);
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Derived Display Data
    const recentMeals = history.slice(0, 3).map(item => {
        const date = new Date(item.date);
        // Simple relative time format
        const timeStr = date.toLocaleDateString() === new Date().toLocaleDateString()
            ? `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : date.toLocaleDateString();

        return {
            name: item.recipe.title,
            score: item.recipe.health_score,
            time: timeStr,
            emoji: "🍽️" // Could imply from ingredients but default is fine
        };
    });

    const achievements = [
        { title: "Waste Warrior", desc: "Saved 20+ ingredients", icon: "🏆", unlocked: stats.ingredientsSaved >= 20 },
        { title: "Health Hero", desc: "Health score 8+", icon: "💪", unlocked: stats.healthScore >= 8 },
        { title: "Chef Master", desc: "Cook 5 recipes", icon: "👨‍🍳", unlocked: stats.recipesCooked >= 5 },
    ];

    // Animated values for visual flair
    const [animatedStats, setAnimatedStats] = useState(stats);

    useEffect(() => {
        if (loading) return;

        const duration = 1000;
        const steps = 30;
        const interval = duration / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            setAnimatedStats({
                healthScore: Math.round(stats.healthScore * progress),
                recipesCooked: Math.round(stats.recipesCooked * progress),
                ingredientsSaved: Math.round(stats.ingredientsSaved * progress),
                wasteSaved: Math.round(stats.wasteSaved * progress),
            });
            if (step >= steps) clearInterval(timer);
        }, interval);

        return () => clearInterval(timer);
    }, [loading, stats]);

    // Mock weekly data based on current score (visual only)
    const weeklyData = [
        { day: "Mon", score: Math.max(5, stats.healthScore - 1) },
        { day: "Tue", score: Math.min(10, stats.healthScore + 1) },
        { day: "Wed", score: stats.healthScore },
        { day: "Thu", score: Math.max(6, stats.healthScore - 2) },
        { day: "Fri", score: stats.healthScore },
        { day: "Sat", score: Math.min(10, stats.healthScore + 1) },
        { day: "Sun", score: stats.healthScore },
    ];

    return (
        <div className="min-h-[100dvh] bg-[#f5f0e8] text-gray-900 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
                <div className="flex items-center gap-4 p-4">
                    <Link href="/" className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">Your Data</h1>
                </div>
            </div>

            <div className="flex-1 p-4 space-y-6 pb-24 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        title="Health Score"
                        value={`${animatedStats.healthScore}/10`}
                        icon={<TrendingUp className="w-5 h-5" />}
                        color="bg-[#d4f0e8]"
                        iconColor="text-emerald-600"
                    />
                    <StatCard
                        title="Recipes Cooked"
                        value={animatedStats.recipesCooked}
                        icon={<ChefHat className="w-5 h-5" />}
                        color="bg-[#fce8d8]"
                        iconColor="text-orange-600"
                        onClick={() => setShowHistoryModal(true)}
                    />
                    <StatCard
                        title="Ingredients Saved"
                        value={animatedStats.ingredientsSaved}
                        icon={<Apple className="w-5 h-5" />}
                        color="bg-[#d8e8f0]"
                        iconColor="text-blue-600"
                    />
                    <StatCard
                        title="Waste Reduced"
                        value={`${animatedStats.wasteSaved}%`}
                        icon={<Leaf className="w-5 h-5" />}
                        color="bg-[#e8f5e0]"
                        iconColor="text-lime-600"
                    />
                </div>

                {/* Weekly Chart */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Weekly Health Trends
                    </h2>
                    <div className="flex items-end justify-between gap-2 h-36">
                        {weeklyData.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                                <div className="text-xs font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {day.score}
                                </div>
                                <div
                                    className={clsx(
                                        "w-full rounded-xl transition-all duration-500 cursor-pointer hover:scale-105",
                                        day.score >= 8
                                            ? "bg-gradient-to-t from-emerald-500 to-emerald-400"
                                            : day.score >= 6
                                                ? "bg-gradient-to-t from-amber-500 to-amber-400"
                                                : "bg-gradient-to-t from-rose-500 to-rose-400"
                                    )}
                                    style={{
                                        height: `${(day.score / 10) * 100}%`,
                                        animationDelay: `${i * 100}ms`
                                    }}
                                />
                                <span className="text-xs font-medium text-gray-500">{day.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Meals */}
                <div>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Recent Meals
                    </h2>
                    {recentMeals.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                            No meals cooked yet. Start cooking! 🍳
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentMeals.map((meal, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">
                                        {meal.emoji}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-800">{meal.name}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                            <Clock className="w-3 h-3" /> {meal.time}
                                        </div>
                                    </div>
                                    <div className={clsx(
                                        "px-3 py-1.5 rounded-xl text-sm font-black",
                                        meal.score >= 8
                                            ? "bg-[#d4f0e8] text-emerald-700"
                                            : "bg-[#fce8d8] text-amber-700"
                                    )}>
                                        {meal.score}/10
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Achievements */}
                <div>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Achievements
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        {achievements.map((achievement, i) => (
                            <div
                                key={i}
                                className={clsx(
                                    "p-4 rounded-2xl text-center transition-all duration-200",
                                    achievement.unlocked
                                        ? "bg-[#fce8d8] border border-orange-200 shadow-sm hover:shadow-md"
                                        : "bg-gray-100 border border-gray-200 opacity-50"
                                )}
                            >
                                <span className="text-3xl">{achievement.icon}</span>
                                <div className="font-bold text-sm mt-2 text-gray-800">{achievement.title}</div>
                                <div className="text-[10px] text-gray-500 mt-1">{achievement.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Achievement Banner */}
                {achievements.some(a => a.unlocked) && (
                    <div className="bg-gradient-to-r from-[#e8d8f0] via-[#f0d8e8] to-[#fce8d8] rounded-2xl p-5 border border-purple-200/50 shadow-sm relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-2 right-6 text-purple-400/30 text-2xl animate-pulse">✦</div>
                        <div className="absolute bottom-3 right-12 text-pink-400/20 text-lg animate-pulse" style={{ animationDelay: '300ms' }}>✦</div>

                        <div className="relative flex items-center gap-4">
                            <span className="text-5xl">🏆</span>
                            <div>
                                <div className="font-black text-xl text-gray-800">Keep it up!</div>
                                <div className="text-sm text-gray-600 mt-1">
                                    You&apos;ve saved <span className="font-bold text-emerald-600">{stats.ingredientsSaved}</span> ingredients total!
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <ChefHat className="w-5 h-5 text-orange-500" />
                                Cooking History
                            </h2>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {history.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    No recipes cooked yet!
                                </div>
                            ) : (
                                history.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedRecipe(item.recipe)}
                                        className="flex items-center gap-4 w-full p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 text-left shrink-0"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">
                                            🍽️
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-800 truncate">{item.recipe.title}</div>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {new Date(item.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Recipe Details Modal (reused from logic, simplified import?) */}
            {/* Using a simplified inline display or separate component if imported */}
            {/* Note: User usually wants to see the recipe. I'll add a simple view logic or just show titles for now as requested "list". But actually opening the recipe is better. */}
            {/* Wait, I can't import RecipeDisplay easily if not exported? it is default exported from components/RecipeDisplay.tsx. Need to check imports. */}
            {/* Checking imports... No RecipeDisplay imported. I need to add it or just show JSON? No, I should add RecipeDisplay. */}
            {/* For now, let's just show the history list. If they click a recipe, I need to display it. */}
            {/* Adding basic Recipe Popup support. */}
            {selectedRecipe && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6">
                        <button
                            onClick={() => setSelectedRecipe(null)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full z-10"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <h2 className="text-2xl font-black mb-4 pr-10">{selectedRecipe.title}</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-bold text-sm text-gray-500 uppercase">Ingredients</h3>
                                <ul className="mt-2 space-y-1">
                                    {selectedRecipe.ingredients.map((ing, i) => (
                                        <li key={i} className="text-sm border-b border-gray-50 py-1">{ing}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-gray-500 uppercase">Instructions</h3>
                                <ol className="mt-2 space-y-3 list-decimal list-inside">
                                    {selectedRecipe.instructions.map((step, i) => (
                                        <li key={i} className="text-sm leading-relaxed">{step}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg border-t border-gray-100 z-30">
                <div className="flex justify-around items-center py-3 px-4">
                    <NavItem icon={<Camera className="w-5 h-5" />} label="Camera" href="/" />
                    <NavItem icon={<Search className="w-5 h-5" />} label="Search" href="/search" />
                    <div className="w-16" /> {/* Spacer for center button */}
                    <NavItem icon={<BarChart2 className="w-5 h-5" />} label="Your Data" active href="/your-data" />
                    <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Help" href="/help" />
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color, iconColor, onClick }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    iconColor: string;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            className={clsx(
                "p-4 rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md text-left w-full relative overflow-hidden",
                color,
                onClick ? "cursor-pointer active:scale-95" : "cursor-default"
            )}
        >
            <div className={clsx(
                "w-11 h-11 rounded-xl flex items-center justify-center bg-white/60 mb-3 shadow-sm",
                iconColor
            )}>
                {icon}
            </div>
            <div className="text-3xl font-black text-gray-800">{value}</div>
            <div className="text-xs text-gray-600 font-medium mt-1">{title}</div>
        </button>
    );
}
