"use client";

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Leaf, Heart, Activity, User, Clock, ChefHat, AlertTriangle, Scale, Droplet } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import clsx from 'clsx';

interface OnboardingProps {
    onComplete: (profile: UserProfile) => void;
}

type Step = 'safety' | 'philosophy' | 'goals' | 'health' | 'kitchen' | 'basics';

const STEPS: Step[] = ['safety', 'philosophy', 'health', 'goals', 'kitchen', 'basics'];

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const currentStep = STEPS[currentStepIndex];

    const [profile, setProfile] = useState<Partial<UserProfile>>({
        healthConditions: [],
        goals: [],
        allergies: []
    });

    const handleNext = () => {
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            // Validate completeness before finishing
            if (isStepValid('basics')) {
                onComplete(profile as UserProfile);
            }
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const updateProfile = (updates: Partial<UserProfile>) => {
        setProfile(prev => ({ ...prev, ...updates }));
    };

    const toggleSelection = (key: keyof UserProfile, value: string) => {
        if (Array.isArray(profile[key])) {
            const currentArray = (profile[key] as string[]) || [];
            if (currentArray.includes(value)) {
                updateProfile({ [key]: currentArray.filter(item => item !== value) });
            } else {
                updateProfile({ [key]: [...currentArray, value] });
            }
        }
    };

    const isStepValid = (step: Step) => {
        switch (step) {
            case 'safety': return true; // Can have no allergies
            case 'philosophy': return !!profile.dietaryApproach;
            case 'health': return true; // Can have no conditions
            case 'goals': return (profile.goals?.length || 0) > 0;
            case 'kitchen': return !!profile.cookingTime && !!profile.cookingConfidence;
            case 'basics': return !!profile.sex && !!profile.age; // Age/Sex required for this demo flow logic
        }
    };

    const renderProgressBar = () => (
        <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
            <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-600 transition-all duration-500 ease-out"
                style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
            />
        </div>
    );

    const renderHeader = (title: string, subtitle: string) => (
        <div className="text-center mb-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <h1 className="text-3xl font-bold text-[#2d3a28] mb-2 font-serif tracking-tight">{title}</h1>
            <p className="text-[#5c6b57] text-lg font-medium leading-relaxed">{subtitle}</p>
        </div>
    );

    const renderOptionCard = (
        label: string,
        description: string | null,
        isSelected: boolean,
        onClick: () => void,
        icon?: React.ReactNode,
        isMulti?: boolean
    ) => (
        <button
            onClick={onClick}
            className={clsx(
                "w-full p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-4 text-left group",
                isSelected
                    ? "bg-[#6b8e23]/10 border-[#6b8e23] shadow-md"
                    : "bg-white/80 border-[#e8ebd9] hover:border-[#b4c498] hover:bg-white"
            )}
        >
            <div className={clsx(
                "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                isSelected ? "bg-[#6b8e23] text-white" : "bg-[#f0f4e8] text-[#6b8e23] group-hover:bg-[#e2e8d4]"
            )}>
                {icon || <Leaf className="w-6 h-6" />}
            </div>
            <div className="flex-1">
                <h3 className={clsx("font-bold text-lg", isSelected ? "text-[#2d3a28]" : "text-gray-700")}>{label}</h3>
                {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
            </div>
            {isMulti && (
                <div className={clsx(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    isSelected ? "bg-[#6b8e23] border-[#6b8e23]" : "border-gray-300"
                )}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
            )}
            {!isMulti && isSelected && <Check className="w-6 h-6 text-[#6b8e23]" />}
        </button>
    );

    return (
        <div className="min-h-[100dvh] w-full bg-[#f4f7f0] flex flex-col items-center p-6 font-sans">
            <div className="w-full max-w-md flex flex-col h-full flex-1">
                {/* Top Logo */}
                <div className="w-full flex justify-center py-4 mb-4">
                    <span className="text-2xl font-bold text-[#2d3a28] flex items-center gap-2">
                        <Leaf className="w-6 h-6 text-[#6b8e23]" />
                        FridgeForager
                    </span>
                </div>

                {renderProgressBar()}

                <div className="flex-1 overflow-y-auto pb-24 px-1">
                    {/* STEP 1: SAFETY FIRST (Allergies) */}
                    {currentStep === 'safety' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                            {renderHeader("Safety First", "Do any members of your household have food allergies?")}

                            {[
                                { id: 'peanuts', label: 'Peanuts', icon: <AlertTriangle className="w-6 h-6" /> },
                                { id: 'treenuts', label: 'Tree Nuts (Almonds, Walnuts)', icon: <Leaf className="w-6 h-6" /> },
                                { id: 'dairy', label: 'Dairy / Lactose', icon: <Droplet className="w-6 h-6" /> },
                                { id: 'shellfish', label: 'Shellfish', icon: <Activity className="w-6 h-6" /> },
                                { id: 'soy', label: 'Soy', icon: <Leaf className="w-6 h-6" /> },
                                { id: 'eggs', label: 'Eggs', icon: <div className="text-xl">🥚</div> },
                                { id: 'gluten', label: 'Gluten / Celiac', icon: <div className="text-xl">🌾</div> },
                            ].map((item) => (
                                renderOptionCard(
                                    item.label,
                                    null,
                                    profile.allergies?.includes(item.id) || false,
                                    () => toggleSelection('allergies', item.id),
                                    item.icon,
                                    true
                                )
                            ))}

                            <div className="mt-4">
                                <input
                                    type="text"
                                    placeholder="Type other allergies here..."
                                    className="w-full p-4 rounded-xl border border-[#e8ebd9] bg-white focus:ring-2 focus:ring-[#6b8e23] focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: FOOD PHILOSOPHY (Diet) */}
                    {currentStep === 'philosophy' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                            {renderHeader("Your Food Philosophy", "What is your primary dietary approach?")}

                            {[
                                { id: 'Omnivore', label: 'Omnivore', desc: 'No restrictions', icon: <div className="text-xl">🍖</div> },
                                { id: 'Vegetarian', label: 'Vegetarian', desc: 'No meat', icon: <Leaf className="w-6 h-6" /> },
                                { id: 'Vegan', label: 'Vegan', desc: 'Plant-based only', icon: <Leaf className="w-6 h-6 text-green-600" /> },
                                { id: 'Flexitarian', label: 'Flexitarian', desc: 'Mostly plants, occasional meat', icon: <Heart className="w-6 h-6" /> },
                            ].map((item) => (
                                renderOptionCard(
                                    item.label,
                                    item.desc,
                                    profile.dietaryApproach === item.id,
                                    () => updateProfile({ dietaryApproach: item.id as UserProfile['dietaryApproach'] }),
                                    item.icon,
                                    false
                                )
                            ))}
                        </div>
                    )}

                    {/* STEP 3: HEALTH PROFILE (Conditions) */}
                    {currentStep === 'health' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                            {renderHeader("Health Profile", "Are you cooking for anyone with specific medical conditions?")}

                            {[
                                { id: 'diabetes', label: 'Type 2 Diabetes / Pre-diabetes', icon: <Droplet className="w-6 h-6" /> },
                                { id: 'heart', label: 'Heart Health (Hypertension)', icon: <Heart className="w-6 h-6" /> },
                                { id: 'obesity', label: 'Obesity Management', icon: <Scale className="w-6 h-6" /> },
                                { id: 'cholesterol', label: 'High Cholesterol', icon: <Activity className="w-6 h-6" /> },
                                { id: 'kidney', label: 'Kidney Health', icon: <Activity className="w-6 h-6" /> },
                            ].map((item) => (
                                renderOptionCard(
                                    item.label,
                                    null,
                                    profile.healthConditions?.includes(item.id) || false,
                                    () => toggleSelection('healthConditions', item.id),
                                    item.icon,
                                    true
                                )
                            ))}
                        </div>
                    )}

                    {/* STEP 4: GOALS */}
                    {currentStep === 'goals' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                            {renderHeader("What's Your Goal?", "What are you aiming to achieve with FridgeForager?")}

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: 'weight_loss', label: 'Sustainable Weight Loss', icon: <Scale className="w-8 h-8" /> },
                                    { id: 'blood_sugar', label: 'Manage Blood Sugar', icon: <Activity className="w-8 h-8" /> },
                                    { id: 'muscle', label: 'Muscle Gain & Strength', icon: <div className="text-3xl">💪</div> },
                                    { id: 'waste', label: 'Reduce Food Waste', icon: <Leaf className="w-8 h-8" /> },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleSelection('goals', item.id)}
                                        className={clsx(
                                            "p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-3 aspect-square justify-center",
                                            profile.goals?.includes(item.id)
                                                ? "bg-[#6b8e23]/10 border-[#6b8e23] shadow-md"
                                                : "bg-[#f8faf5] border-[#e8ebd9] hover:bg-white"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-14 h-14 rounded-full flex items-center justify-center transition-colors mb-2",
                                            profile.goals?.includes(item.id) ? "bg-[#6b8e23] text-white" : "bg-white text-[#6b8e23]"
                                        )}>
                                            {item.icon}
                                        </div>
                                        <span className="font-bold text-sm text-[#2d3a28] leading-tight">{item.label}</span>
                                        {profile.goals?.includes(item.id) && (
                                            <div className="absolute top-2 right-2 bg-[#6b8e23] rounded-full p-1">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 p-4 bg-white/60 rounded-xl border border-[#e8ebd9]">
                                <p className="text-sm font-bold text-[#5c6b57] mb-2 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[#f0f4e8] flex items-center justify-center">💬</span>
                                    Specific Dislikes?
                                </p>
                                <input
                                    type="text"
                                    placeholder="e.g. 'No cilantro', 'Hate mushrooms'..."
                                    value={profile.customDislikes || ''}
                                    onChange={(e) => updateProfile({ customDislikes: e.target.value })}
                                    className="w-full bg-transparent border-b border-[#e8ebd9] focus:border-[#6b8e23] outline-none py-1 transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 5: KITCHEN REALITY */}
                    {currentStep === 'kitchen' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                            {renderHeader("Your Kitchen Reality", "Let's be real about time and skill.")}

                            <div>
                                <h3 className="text-sm font-bold text-[#5c6b57] uppercase tracking-wider mb-3 ml-1">Cooking Time</h3>
                                <div className="space-y-3">
                                    {[
                                        { id: 'Time Crunch', label: 'Time Crunch', sub: '< 20 mins', icon: <Clock className="w-5 h-5" /> },
                                        { id: 'Standard', label: 'Standard', sub: '30-45 mins', icon: <div className="text-lg">👜</div> },
                                        { id: 'Project Cook', label: 'Project Cook', sub: '1 hour+', icon: <ChefHat className="w-5 h-5" /> },
                                    ].map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <button
                                                onClick={() => updateProfile({ cookingTime: item.id as UserProfile['cookingTime'] })}
                                                className={clsx(
                                                    "flex-1 p-4 rounded-xl border-2 transition-all flex items-center gap-3",
                                                    profile.cookingTime === item.id
                                                        ? "bg-[#6b8e23] border-[#6b8e23] text-white shadow-lg"
                                                        : "bg-white border-[#e8ebd9] hover:bg-[#f8faf5] text-[#2d3a28]"
                                                )}
                                            >
                                                {item.icon}
                                                <span className="font-bold">{item.label}</span>
                                            </button>
                                            <div className="flex items-center justify-center px-4 rounded-xl bg-white border border-[#e8ebd9] text-gray-500 font-medium min-w-[100px]">
                                                {item.sub}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-[#5c6b57] uppercase tracking-wider mb-3 ml-1">Confidence Level</h3>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'Beginner', label: 'Beginner', sub: 'Keep it simple' },
                                        { id: 'Intermediate', label: 'Intermediate', sub: 'Comfortable' },
                                        { id: 'Pro', label: 'Pro', sub: 'Challenge me' },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => updateProfile({ cookingConfidence: item.id as UserProfile['cookingConfidence'] })}
                                            className={clsx(
                                                "flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center gap-1 min-h-[100px]",
                                                profile.cookingConfidence === item.id
                                                    ? "bg-[#f0f4e8] border-[#6b8e23] shadow-inner"
                                                    : "bg-white border-[#e8ebd9] hover:bg-[#f8faf5]"
                                            )}
                                        >
                                            <span className={clsx("font-bold text-sm", profile.cookingConfidence === item.id ? "text-[#6b8e23]" : "text-gray-700")}>
                                                {item.label}
                                            </span>
                                            <span className="text-[10px] text-gray-400 leading-tight">{item.sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 6: THE BASICS */}
                    {currentStep === 'basics' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                            {renderHeader("The Basics", "This helps us calculate nutritional baselines accurately.")}

                            <div className="bg-white p-6 rounded-2xl border border-[#e8ebd9] shadow-sm">
                                <h3 className="text-lg font-bold text-[#2d3a28] mb-4">Age</h3>
                                <div className="flex items-center justify-center gap-6">
                                    <button
                                        onClick={() => updateProfile({ age: Math.max(1, (profile.age || 30) - 1) })}
                                        className="w-10 h-10 rounded-full bg-[#f0f4e8] text-[#6b8e23] flex items-center justify-center hover:bg-[#e2e8d4]"
                                    >-</button>
                                    <span className="text-4xl font-black text-[#2d3a28] w-16 text-center">{profile.age || 30}</span>
                                    <button
                                        onClick={() => updateProfile({ age: (profile.age || 30) + 1 })}
                                        className="w-10 h-10 rounded-full bg-[#f0f4e8] text-[#6b8e23] flex items-center justify-center hover:bg-[#e2e8d4]"
                                    >+</button>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-[#e8ebd9] shadow-sm">
                                <h3 className="text-lg font-bold text-[#2d3a28] mb-4">Biological Sex</h3>
                                <div className="flex gap-2">
                                    {['Female', 'Male', 'Prefer not to say'].map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => updateProfile({ sex: option as any })}
                                            className={clsx(
                                                "flex-1 py-3 px-2 rounded-xl text-sm font-bold transition-all border-2",
                                                profile.sex === option
                                                    ? "bg-[#6b8e23] border-[#6b8e23] text-white"
                                                    : "bg-white border-[#e8ebd9] text-gray-600 hover:border-[#cbd5e1]"
                                            )}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Navigation */}
                <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 safe-area-pb">
                    <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                        <button
                            onClick={handleBack}
                            disabled={currentStepIndex === 0}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[#5c6b57] transition-colors",
                                currentStepIndex === 0 ? "opacity-0 pointer-events-none" : "hover:bg-[#f0f4e8]"
                            )}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Back
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={!isStepValid(currentStep)}
                            className="flex-1 bg-[#c05621] hover:bg-[#9c4221] active:bg-[#7b341e] text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            {currentStepIndex === STEPS.length - 1 ? 'Start Foraging' : 'Continue'}
                            {currentStepIndex !== STEPS.length - 1 && <ChevronRight className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
