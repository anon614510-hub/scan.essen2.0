"use client";

import { ArrowLeft, TrendingUp, Leaf, Clock, ChefHat, Apple, Trophy, Target, Zap, Camera, Search, BarChart2, HelpCircle } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useState, useEffect } from "react";

// Mock data for demonstration
const STATS = {
    healthScore: 8,
    recipesCooked: 14,
    ingredientsSaved: 23,
    wasteSaved: 32,
};

const WEEKLY_DATA = [
    { day: "Mon", score: 7 },
    { day: "Tue", score: 8 },
    { day: "Wed", score: 6 },
    { day: "Thu", score: 9 },
    { day: "Fri", score: 8 },
    { day: "Sat", score: 7 },
    { day: "Sun", score: 8 },
];

const RECENT_MEALS = [
    { name: "Spinach Omelette", score: 9, time: "Today, 8:30 AM", emoji: "🍳" },
    { name: "Grilled Chicken Salad", score: 8, time: "Yesterday, 1:00 PM", emoji: "🥗" },
    { name: "Pasta Primavera", score: 7, time: "Yesterday, 7:30 PM", emoji: "🍝" },
];

const ACHIEVEMENTS = [
    { title: "Waste Warrior", desc: "Saved 20+ ingredients", icon: "🏆", unlocked: true },
    { title: "Health Hero", desc: "Average score 8+", icon: "💪", unlocked: true },
    { title: "Chef Master", desc: "Cook 50 recipes", icon: "👨‍🍳", unlocked: false },
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

export default function YourDataPage() {
    const [animatedValues, setAnimatedValues] = useState({
        health: 0,
        recipes: 0,
        saved: 0,
        waste: 0
    });

    // Animate stats on mount
    useEffect(() => {
        const duration = 1000;
        const steps = 30;
        const interval = duration / steps;

        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            setAnimatedValues({
                health: Math.round(STATS.healthScore * progress),
                recipes: Math.round(STATS.recipesCooked * progress),
                saved: Math.round(STATS.ingredientsSaved * progress),
                waste: Math.round(STATS.wasteSaved * progress),
            });
            if (step >= steps) clearInterval(timer);
        }, interval);

        return () => clearInterval(timer);
    }, []);

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
                        value={`${animatedValues.health}/10`}
                        icon={<TrendingUp className="w-5 h-5" />}
                        color="bg-[#d4f0e8]"
                        iconColor="text-emerald-600"
                    />
                    <StatCard
                        title="Recipes Cooked"
                        value={animatedValues.recipes}
                        icon={<ChefHat className="w-5 h-5" />}
                        color="bg-[#fce8d8]"
                        iconColor="text-orange-600"
                    />
                    <StatCard
                        title="Ingredients Saved"
                        value={animatedValues.saved}
                        icon={<Apple className="w-5 h-5" />}
                        color="bg-[#d8e8f0]"
                        iconColor="text-blue-600"
                    />
                    <StatCard
                        title="Waste Reduced"
                        value={`${animatedValues.waste}%`}
                        icon={<Leaf className="w-5 h-5" />}
                        color="bg-[#e8f5e0]"
                        iconColor="text-lime-600"
                    />
                </div>

                {/* Weekly Chart */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Weekly Health Score
                    </h2>
                    <div className="flex items-end justify-between gap-2 h-36">
                        {WEEKLY_DATA.map((day, i) => (
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
                    <div className="space-y-3">
                        {RECENT_MEALS.map((meal, i) => (
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
                </div>

                {/* Achievements */}
                <div>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Achievements
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        {ACHIEVEMENTS.map((achievement, i) => (
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
                <div className="bg-gradient-to-r from-[#e8d8f0] via-[#f0d8e8] to-[#fce8d8] rounded-2xl p-5 border border-purple-200/50 shadow-sm relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-2 right-6 text-purple-400/30 text-2xl animate-pulse">✦</div>
                    <div className="absolute bottom-3 right-12 text-pink-400/20 text-lg animate-pulse" style={{ animationDelay: '300ms' }}>✦</div>

                    <div className="relative flex items-center gap-4">
                        <span className="text-5xl">🏆</span>
                        <div>
                            <div className="font-black text-xl text-gray-800">Waste Warrior!</div>
                            <div className="text-sm text-gray-600 mt-1">
                                You've saved <span className="font-bold text-emerald-600">{STATS.ingredientsSaved}</span> ingredients this week
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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

function StatCard({ title, value, icon, color, iconColor }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    iconColor: string;
}) {
    return (
        <div className={clsx(
            "p-4 rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md cursor-default",
            color
        )}>
            <div className={clsx(
                "w-11 h-11 rounded-xl flex items-center justify-center bg-white/60 mb-3 shadow-sm",
                iconColor
            )}>
                {icon}
            </div>
            <div className="text-3xl font-black text-gray-800">{value}</div>
            <div className="text-xs text-gray-600 font-medium mt-1">{title}</div>
        </div>
    );
}
