"use client";

import { useState } from "react";
import { Search as SearchIcon, ArrowLeft, ChefHat, Clock, Flame, Sparkles, TrendingUp, Camera, BarChart2, HelpCircle } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const POPULAR_SEARCHES = [
    { name: "Quick Breakfast", icon: "🍳", time: "15 min", color: "bg-[#fce8d8]" },
    { name: "Healthy Lunch", icon: "🥗", time: "25 min", color: "bg-[#d4f0e8]" },
    { name: "Easy Dinner", icon: "🍝", time: "30 min", color: "bg-[#e8d8f0]" },
    { name: "Smoothie Bowl", icon: "🫐", time: "5 min", color: "bg-[#d8e8f0]" },
    { name: "Protein Rich", icon: "💪", time: "20 min", color: "bg-[#f0e8d8]" },
    { name: "Vegetarian", icon: "🥬", time: "25 min", color: "bg-[#e8f5e0]" },
];

const RECENT_SEARCHES = [
    "Eggs and spinach recipe",
    "Low carb dinner",
    "Milk based dessert",
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
    const [query, setQuery] = useState("");

    return (
        <div className="min-h-[100dvh] bg-[#f5f0e8] text-gray-900 flex flex-col">
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
                            placeholder="Search recipes, ingredients..."
                            autoFocus
                            className="w-full h-12 rounded-xl bg-gray-100 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:bg-white transition-all duration-200"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 space-y-6 pb-24 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
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

                {/* Recent Searches */}
                {RECENT_SEARCHES.length > 0 && (
                    <div>
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Recent Searches
                        </h2>
                        <div className="space-y-2">
                            {RECENT_SEARCHES.map((search, i) => (
                                <button
                                    key={i}
                                    onClick={() => setQuery(search)}
                                    className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 text-left group shadow-sm border border-gray-100"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                    <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{search}</span>
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
            </div>

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
        </div>
    );
}
