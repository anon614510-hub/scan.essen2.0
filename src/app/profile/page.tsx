"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@prisma/client"; // This might lint error in editor but work in build
import { getProfileAction, saveProfileAction } from "@/app/actions";
import { ArrowLeft, Check, ChefHat, Leaf, Flame, Heart, AlertTriangle } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";

// Fallback type if import fails during dev
type ProfileData = {
    dietaryType: string;
    allergies: string[];
    cookingSkill: string;
    goals: string[];
};

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ProfileData>({
        dietaryType: "Omnivore",
        allergies: [],
        cookingSkill: "Beginner",
        goals: []
    });

    useEffect(() => {
        getProfileAction().then(data => {
            if (data) {
                setProfile({
                    dietaryType: data.dietaryType || "Omnivore",
                    allergies: data.allergies || [],
                    cookingSkill: data.cookingSkill || "Beginner",
                    goals: data.goals || []
                });
            }
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveProfileAction(profile);
            // Show toast or something? For now just redirect back or show success state
            router.push("/");
        } catch (e) {
            console.error(e);
            alert("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const toggleArrayItem = (field: 'allergies' | 'goals', item: string) => {
        setProfile(prev => {
            const list = prev[field];
            if (list.includes(item)) {
                return { ...prev, [field]: list.filter(i => i !== item) };
            } else {
                return { ...prev, [field]: [...list, item] };
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#f5f0e8] text-gray-900 font-sans pb-24">
            {/* Header */}
            <div className="bg-white p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
                <Link href="/" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-lg font-bold">Your Food Profile</h1>
                <div className="w-8" />
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading profile...</div>
            ) : (
                <div className="p-4 space-y-8 max-w-md mx-auto">

                    {/* Dietary Type */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Leaf className="w-5 h-5 text-emerald-600" />
                            Dietary Preference
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {["Omnivore", "Vegetarian", "Vegan", "Pescatarian", "Keto", "Paleo"].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setProfile({ ...profile, dietaryType: type })}
                                    className={clsx(
                                        "p-4 rounded-xl border-2 text-left transition-all",
                                        profile.dietaryType === type
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                    )}
                                >
                                    <span className="font-semibold block">{type}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Allergies */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            Allergies & Avoidances
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {["Peanuts", "Tree Nuts", "Dairy", "Gluten", "Shellfish", "Soy", "Eggs", "Fish"].map(allergy => (
                                <button
                                    key={allergy}
                                    onClick={() => toggleArrayItem('allergies', allergy)}
                                    className={clsx(
                                        "px-4 py-2 rounded-full border transition-all text-sm font-medium",
                                        profile.allergies.includes(allergy)
                                            ? "bg-orange-100 border-orange-500 text-orange-800"
                                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                    )}
                                >
                                    {allergy}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Cooking Skill */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <ChefHat className="w-5 h-5 text-blue-600" />
                            Cooking Skill
                        </h2>
                        <div className="space-y-3">
                            {["Beginner", "Intermediate", "Pro"].map(skill => (
                                <button
                                    key={skill}
                                    onClick={() => setProfile({ ...profile, cookingSkill: skill })}
                                    className={clsx(
                                        "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between",
                                        profile.cookingSkill === skill
                                            ? "border-blue-500 bg-blue-50 text-blue-800"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                    )}
                                >
                                    <span className="font-semibold">{skill}</span>
                                    {profile.cookingSkill === skill && <Check className="w-5 h-5" />}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Goals */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-500" />
                            Goals
                        </h2>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                "Eat Healthier",
                                "Lose Weight",
                                "Gain Muscle",
                                "Save Money",
                                "Quick Meals (< 30 mins)",
                                "Reduce Food Waste"
                            ].map(goal => (
                                <button
                                    key={goal}
                                    onClick={() => toggleArrayItem('goals', goal)}
                                    className={clsx(
                                        "p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between",
                                        profile.goals.includes(goal)
                                            ? "border-red-400 bg-red-50 text-red-800"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                    )}
                                >
                                    <span className="font-medium">{goal}</span>
                                    {profile.goals.includes(goal) && <Check className="w-5 h-5" />}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-70"
                    >
                        {saving ? "Saving..." : "Save Profile"}
                    </button>
                </div>
            )}
        </div>
    );
}
