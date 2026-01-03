"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfileAction } from "@/app/actions";
import { ArrowRight, Check, Activity, Target, AlertTriangle } from "lucide-react";
import clsx from "clsx";

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        age: "",
        height: "", // cm
        weight: "", // kg
        gender: "",
        goals: [] as string[],
        allergies: [] as string[],
        dietaryType: "Omnivore"
    });

    const handleNext = async () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            // Finish
            setSaving(true);
            try {
                await saveProfileAction({
                    age: parseInt(formData.age) || undefined,
                    height: parseInt(formData.height) || undefined,
                    weight: parseInt(formData.weight) || undefined,
                    gender: formData.gender,
                    goals: formData.goals,
                    allergies: formData.allergies,
                    dietaryType: formData.dietaryType
                });
                router.push("/");
            } catch (e) {
                console.error(e);
                alert("Failed to save profile. Please try again.");
                setSaving(false);
            }
        }
    };

    const toggleArrayItem = (field: 'goals' | 'allergies', item: string) => {
        setFormData(prev => {
            const list = prev[field];
            if (list.includes(item)) {
                return { ...prev, [field]: list.filter(i => i !== item) };
            } else {
                return { ...prev, [field]: [...list, item] };
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#f5f0e8] text-gray-900 font-sans flex flex-col justify-center p-6">
            <div className="max-w-md mx-auto w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8">

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={clsx("h-2 flex-1 rounded-full transition-colors", i <= step ? "bg-gray-900" : "bg-gray-100")} />
                    ))}
                </div>

                {/* Content */}
                <div className="min-h-[300px]">
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h1 className="text-3xl font-black mb-2">Tell us about you</h1>
                            <p className="text-gray-500 mb-6">This helps us count calories correctly.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Age</label>
                                    <input
                                        type="number"
                                        value={formData.age}
                                        onChange={e => setFormData({ ...formData, age: e.target.value })}
                                        className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                                        placeholder="e.g. 25"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Height (cm)</label>
                                        <input
                                            type="number"
                                            value={formData.height}
                                            onChange={e => setFormData({ ...formData, height: e.target.value })}
                                            className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                                            placeholder="e.g. 175"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Weight (kg)</label>
                                        <input
                                            type="number"
                                            value={formData.weight}
                                            onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                            className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                                            placeholder="e.g. 70"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Gender</label>
                                    <div className="flex gap-2">
                                        {["Male", "Female", "Other"].map(g => (
                                            <button
                                                key={g}
                                                onClick={() => setFormData({ ...formData, gender: g })}
                                                className={clsx(
                                                    "flex-1 py-3 rounded-xl border-2 font-medium transition-all",
                                                    formData.gender === g ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:border-gray-300"
                                                )}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
                                <Activity className="w-8 h-8 text-red-500" />
                                Your Goals
                            </h1>
                            <p className="text-gray-500 mb-6">What do you want to achieve?</p>

                            <div className="space-y-3">
                                {[
                                    "Lose Weight",
                                    "Build Muscle",
                                    "Eat Healthier",
                                    "Save Money",
                                    "Quick Meals"
                                ].map(goal => (
                                    <button
                                        key={goal}
                                        onClick={() => toggleArrayItem('goals', goal)}
                                        className={clsx(
                                            "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between",
                                            formData.goals.includes(goal)
                                                ? "border-red-500 bg-red-50 text-red-900"
                                                : "border-gray-200 hover:border-gray-300"
                                        )}
                                    >
                                        <span className="font-bold">{goal}</span>
                                        {formData.goals.includes(goal) && <Check className="w-5 h-5" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-8 h-8 text-orange-500" />
                                Safety First
                            </h1>
                            <p className="text-gray-500 mb-6">Do you have any severe allergies?</p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {["Peanuts", "Tree Nuts", "Dairy", "Gluten", "Shellfish", "Soy", "Eggs", "Fish"].map(allergy => (
                                    <button
                                        key={allergy}
                                        onClick={() => toggleArrayItem('allergies', allergy)}
                                        className={clsx(
                                            "px-4 py-2 rounded-full border-2 transition-all font-medium",
                                            formData.allergies.includes(allergy)
                                                ? "bg-orange-100 border-orange-500 text-orange-900"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                        )}
                                    >
                                        {allergy}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Dietary Preference</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["Omnivore", "Vegetarian", "Vegan", "Keto"].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFormData({ ...formData, dietaryType: type })}
                                            className={clsx(
                                                "p-3 rounded-xl border-2 text-center text-sm font-bold transition-all",
                                                formData.dietaryType === type ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-gray-200"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={saving}
                        className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-black transition-transform active:scale-95 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : step === 3 ? "Finish Setup" : "Next Step"}
                        {!saving && <ArrowRight className="w-5 h-5" />}
                    </button>
                </div>

            </div>
        </div>
    );
}
