"use client";

import { ArrowLeft, Camera, Search, BarChart2, Scan, MessageCircle, Mail, ExternalLink, ChevronDown, Sparkles, HelpCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";

const FAQ_ITEMS = [
    {
        question: "How do I scan my fridge?",
        answer: "Tap the Camera button at the bottom, point your phone at your fridge, and press the white shutter button. Our AI will automatically detect ingredients!",
        icon: "📸"
    },
    {
        question: "How accurate is ingredient detection?",
        answer: "Our AI uses GPT-4 Vision technology and is highly accurate. For best results, ensure good lighting and keep food items visible.",
        icon: "🎯"
    },
    {
        question: "How are recipes generated?",
        answer: "We analyze your detected ingredients and use AI to suggest healthy, delicious recipes that minimize food waste.",
        icon: "🧠"
    },
    {
        question: "What does the health score mean?",
        answer: "The health score (1-10) rates recipes based on nutritional value, including protein, vitamins, and balanced macros.",
        icon: "💚"
    },
    {
        question: "How do you calculate waste saved?",
        answer: "We track ingredients you use in recipes that might otherwise expire. This helps reduce food waste and save money!",
        icon: "🌱"
    },
    {
        question: "Is my data saved?",
        answer: "Yes! Your ingredients, recipes, and stats are saved automatically to your device, so you won't lose them when you reload.",
        icon: "💾"
    },
];

const FEATURES = [
    { icon: <Camera className="w-5 h-5" />, title: "Camera Scan", desc: "AI-powered ingredient detection", color: "bg-[#d4f0e8]", iconBg: "bg-emerald-500", iconColor: "text-white" },
    { icon: <Search className="w-5 h-5" />, title: "Smart Search", desc: "Find recipes by ingredients", color: "bg-[#d8e8f0]", iconBg: "bg-blue-500", iconColor: "text-white" },
    { icon: <BarChart2 className="w-5 h-5" />, title: "Health Tracking", desc: "Monitor your nutrition", color: "bg-[#e8d8f0]", iconBg: "bg-purple-500", iconColor: "text-white" },
    { icon: <Scan className="w-5 h-5" />, title: "Recipe Generator", desc: "AI creates custom recipes", color: "bg-[#fce8d8]", iconBg: "bg-orange-500", iconColor: "text-white" },
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

export default function HelpPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="min-h-[100dvh] bg-[#f5f0e8] text-gray-900 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
                <div className="flex items-center gap-4 p-4">
                    <Link href="/" className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-emerald-600" />
                        <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 space-y-6 pb-24 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                {/* Quick Start */}
                <div className="bg-gradient-to-r from-[#d4f0e8] via-[#e8f5e0] to-[#d4f0e8] rounded-2xl p-5 border border-emerald-200/50 shadow-sm relative overflow-hidden">
                    {/* Decorative sparkles */}
                    <div className="absolute top-3 right-5 text-emerald-400/40 animate-pulse">✦</div>
                    <div className="absolute bottom-4 right-10 text-green-400/30 animate-pulse" style={{ animationDelay: '400ms' }}>✦</div>

                    <div className="relative">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-700">
                            <Sparkles className="w-5 h-5" />
                            Quick Start Guide
                        </h2>
                        <ol className="space-y-3">
                            {[
                                "Allow camera access when prompted",
                                "Point your camera at your fridge",
                                "Tap the shutter button to scan ingredients",
                                "Tap the ⚡ icon to generate recipes!"
                            ].map((step, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                                    <span className="bg-emerald-500 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-md">
                                        {i + 1}
                                    </span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

                {/* Features */}
                <div>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Features
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {FEATURES.map((feature, i) => (
                            <div
                                key={i}
                                className={clsx(
                                    "p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200",
                                    feature.color
                                )}
                            >
                                <div className={clsx(
                                    "w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-md",
                                    feature.iconBg,
                                    feature.iconColor
                                )}>
                                    {feature.icon}
                                </div>
                                <div className="font-bold text-sm text-gray-800">{feature.title}</div>
                                <div className="text-xs text-gray-500 mt-1">{feature.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ */}
                <div>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-3">
                        {FAQ_ITEMS.map((faq, i) => (
                            <div
                                key={i}
                                className={clsx(
                                    "rounded-2xl bg-white border transition-all duration-200 shadow-sm",
                                    openFaq === i ? "border-emerald-300" : "border-gray-100 hover:border-gray-200"
                                )}
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full p-4 flex items-center gap-3 text-left"
                                >
                                    <span className="text-xl">{faq.icon}</span>
                                    <span className="flex-1 font-medium text-gray-800">{faq.question}</span>
                                    <ChevronDown className={clsx(
                                        "w-5 h-5 text-gray-400 transition-transform duration-200",
                                        openFaq === i && "rotate-180"
                                    )} />
                                </button>
                                <div className={clsx(
                                    "overflow-hidden transition-all duration-300",
                                    openFaq === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                                )}>
                                    <p className="px-4 pb-4 text-sm text-gray-600 leading-relaxed ml-9">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact */}
                <div>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                        Need More Help?
                    </h2>
                    <div className="space-y-3">
                        <a
                            href="mailto:support@fridgeforager.app"
                            className="flex items-center gap-4 p-4 rounded-2xl bg-[#d8e8f0] border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-200 group"
                        >
                            <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center shadow-md">
                                <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-800">Email Support</div>
                                <div className="text-xs text-gray-500">support@fridgeforager.app</div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </a>
                        <a
                            href="#"
                            className="flex items-center gap-4 p-4 rounded-2xl bg-[#d4f0e8] border border-emerald-200/50 shadow-sm hover:shadow-md transition-all duration-200 group"
                        >
                            <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-800">Live Chat</div>
                                <div className="text-xs text-gray-500">Available 9 AM - 6 PM</div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                        </a>
                    </div>
                </div>

                {/* Version */}
                <div className="text-center text-xs text-gray-500 pt-4">
                    <p className="font-medium">FridgeForager v0.1.0</p>
                    <p className="mt-1">Made with 💚 for healthier eating</p>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg border-t border-gray-100 z-30">
                <div className="flex justify-around items-center py-3 px-4">
                    <NavItem icon={<Camera className="w-5 h-5" />} label="Camera" href="/" />
                    <NavItem icon={<Search className="w-5 h-5" />} label="Search" href="/search" />
                    <div className="w-16" /> {/* Spacer for center button */}
                    <NavItem icon={<BarChart2 className="w-5 h-5" />} label="Your Data" href="/your-data" />
                    <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Help" active href="/help" />
                </div>
            </div>
        </div>
    );
}
