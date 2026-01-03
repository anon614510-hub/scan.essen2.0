"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Check, Leaf, Heart, Activity, Clock, ChefHat, AlertTriangle, Scale, Droplet, MapPin } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import clsx from 'clsx';
import AnimatedProgressChart from './AnimatedProgressChart';

interface OnboardingProps {
    onComplete: (profile: UserProfile) => void;
    initialProfile?: Partial<UserProfile> | null;
}

type Step = 'welcome' | 'safety' | 'philosophy' | 'health' | 'goals' | 'kitchen' | 'age' | 'diseases' | 'region' | 'preview' | 'complete';

const STEPS: Step[] = ['welcome', 'safety', 'philosophy', 'health', 'goals', 'kitchen', 'age', 'diseases', 'region', 'preview', 'complete'];

// Confetti component for celebration
const Confetti = () => {
    const [confettiPieces, setConfettiPieces] = useState<{
        id: number;
        color: string;
        left: string;
        delay: string;
        duration: string;
        borderRadius: string;
        rotation: number;
    }[]>([]);

    useEffect(() => {
        const colors = ['#6b8e23', '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setConfettiPieces(Array.from({ length: 50 }, (_, i) => ({
            id: i,
            color: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 2}s`,
            duration: `${2 + Math.random() * 2}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            rotation: Math.random() * 360
        })));
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {confettiPieces.map((piece) => (
                <div
                    key={piece.id}
                    className="absolute w-3 h-3 animate-confetti"
                    style={{
                        left: piece.left,
                        top: '-20px',
                        backgroundColor: piece.color,
                        animationDelay: piece.delay,
                        animationDuration: piece.duration,
                        borderRadius: piece.borderRadius,
                        transform: `rotate(${piece.rotation}deg)`
                    }}
                />
            ))}
        </div>
    );
};

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
].sort();

const COMMON_DISEASES = [
    "Diabetes (Type 1)", "Diabetes (Type 2)", "Hypertension (High BP)", "PCOS/PCOD",
    "Hypothyroidism", "Hyperthyroidism", "Cholesterol", "Gerd/Acidity",
    "Celiac Disease", "IBS", "Anemia", "Chronic Kidney Disease", "Heart Disease"
].sort();

export default function Onboarding({ onComplete, initialProfile }: OnboardingProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [stepKey, setStepKey] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [typedText, setTypedText] = useState('');
    const currentStep = STEPS[currentStepIndex];

    const [profile, setProfile] = useState<Partial<UserProfile>>(initialProfile || {
        healthConditions: [],
        goals: [],
        allergies: [],
        age: undefined,
        sex: undefined
    });

    // Typewriter effect for welcome screen
    const fullText = "ScanEssen";
    useEffect(() => {
        if (currentStep === 'welcome') {
            setTypedText('');
            let index = 0;
            const timer = setInterval(() => {
                if (index < fullText.length) {
                    setTypedText(fullText.slice(0, index + 1));
                    index++;
                } else {
                    clearInterval(timer);
                }
            }, 120);
            return () => clearInterval(timer);
        }
    }, [currentStep]);

    // Trigger confetti on complete step
    useEffect(() => {
        if (currentStep === 'complete') {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [currentStep]);

    const handleNext = useCallback(() => {
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
            setStepKey(prev => prev + 1);
        } else {
            onComplete(profile as UserProfile);
        }
    }, [currentStepIndex, onComplete, profile]);

    const handleBack = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
            setStepKey(prev => prev + 1);
        }
    }, [currentStepIndex]);

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

    const isStepValid = (step: Step): boolean => {
        switch (step) {
            case 'welcome': return true;
            case 'safety': return true;
            case 'philosophy': return !!profile.dietaryApproach;
            case 'health': return true;
            case 'goals': return (profile.goals?.length || 0) > 0;
            case 'kitchen': return !!profile.cookingTime && !!profile.cookingConfidence;
            case 'age': return !!profile.age && !!profile.sex;
            case 'diseases': return true;
            case 'region': return !!profile.state && !!profile.preferredLanguage;
            case 'preview': return true;
            case 'complete': return true;
        }
    };

    // Skip welcome and complete steps in progress calculation
    const progressSteps = STEPS.filter(s => s !== 'welcome' && s !== 'complete' && s !== 'preview');
    const getProgressIndex = () => {
        const actualStep = STEPS[currentStepIndex];
        if (actualStep === 'welcome') return 0;
        if (actualStep === 'complete' || actualStep === 'preview') return progressSteps.length;
        return progressSteps.indexOf(actualStep) + 1;
    };

    const renderProgressBar = () => (
        <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
            <div
                className="h-full bg-gradient-to-r from-[#6b8e23] via-[#8fbc5a] to-[#c05621] transition-all duration-700 ease-out"
                style={{ width: `${(getProgressIndex() / progressSteps.length) * 100}%` }}
            />
        </div>
    );

    const renderHeader = (title: string, subtitle: string) => (
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#2d3a28] mb-2 font-serif tracking-tight animate-fade-up" style={{ animationDelay: '100ms' }}>
                {title}
            </h1>
            <p className="text-[#5c6b57] text-lg font-medium leading-relaxed animate-fade-up" style={{ animationDelay: '200ms' }}>
                {subtitle}
            </p>
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
                    ? "bg-[#6b8e23]/10 border-[#6b8e23] shadow-md animate-selected-pulse"
                    : "bg-white/80 border-[#e8ebd9] hover:border-[#b4c498] hover:bg-white"
            )}
        >
            <div className={clsx(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                isSelected ? "bg-[#6b8e23] text-white scale-110" : "bg-[#f0f4e8] text-[#6b8e23] group-hover:bg-[#e2e8d4]"
            )}>
                {icon || <Leaf className="w-6 h-6" />}
            </div>
            <div className="flex-1">
                <h3 className={clsx("font-bold text-lg transition-colors", isSelected ? "text-[#2d3a28]" : "text-gray-700")}>{label}</h3>
                {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
            </div>
            {isMulti && (
                <div className={clsx(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    isSelected ? "bg-[#6b8e23] border-[#6b8e23] scale-110" : "border-gray-300"
                )}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
            )}
            {!isMulti && isSelected && <Check className="w-6 h-6 text-[#6b8e23]" />}
        </button>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            // WELCOME SCREEN
            case 'welcome':
                return (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="animate-logo-bounce mb-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6b8e23] to-[#8fbc5a] flex items-center justify-center shadow-xl">
                                <Leaf className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        <h1 className="text-4xl font-black text-[#2d3a28] mb-2 font-serif">
                            {typedText}
                            <span className="animate-cursor-blink text-[#6b8e23]">|</span>
                        </h1>

                        <p className="text-[#5c6b57] text-lg animate-fade-up mt-4" style={{ animationDelay: '1200ms' }}>
                            Smart recipes from your fridge
                        </p>

                        <div className="animate-fade-up mt-8" style={{ animationDelay: '1500ms' }}>
                            <p className="text-gray-500 text-sm">Let&apos;s personalize your experience</p>
                        </div>
                    </div >
                );

            // SAFETY (Allergies)
            case 'safety':
                const allergyOptions = [
                    { id: 'peanuts', label: 'Peanuts', icon: <AlertTriangle className="w-6 h-6" /> },
                    { id: 'treenuts', label: 'Tree Nuts (Almonds, Walnuts)', icon: <Leaf className="w-6 h-6" /> },
                    { id: 'dairy', label: 'Dairy / Lactose', icon: <Droplet className="w-6 h-6" /> },
                    { id: 'shellfish', label: 'Shellfish', icon: <Activity className="w-6 h-6" /> },
                    { id: 'soy', label: 'Soy', icon: <Leaf className="w-6 h-6" /> },
                    { id: 'eggs', label: 'Eggs', icon: <div className="text-xl">🥚</div> },
                    { id: 'gluten', label: 'Gluten / Celiac', icon: <div className="text-xl">🌾</div> },
                ];
                return (
                    <div className="space-y-4">
                        {renderHeader("Safety First", "Do any members of your household have food allergies?")}
                        {allergyOptions.map((item, index) => (
                            <div key={item.id} className={`animate-card-entrance onboard-stagger-${Math.min(index + 1, 8)}`}>
                                {renderOptionCard(
                                    item.label,
                                    null,
                                    profile.allergies?.includes(item.id) || false,
                                    () => toggleSelection('allergies', item.id),
                                    item.icon,
                                    true
                                )}
                            </div>
                        ))}
                        <div className="mt-4 animate-card-entrance onboard-stagger-8">
                            <input
                                type="text"
                                placeholder="Type other allergies here..."
                                className="w-full p-4 rounded-xl border border-[#e8ebd9] bg-white focus:ring-2 focus:ring-[#6b8e23] focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                );

            // PHILOSOPHY (Diet)
            case 'philosophy':
                const dietOptions = [
                    { id: 'Omnivore', label: 'Omnivore', desc: 'No restrictions', icon: <div className="text-xl">🍖</div> },
                    { id: 'Non-Vegetarian', label: 'Non-Vegetarian', desc: 'Meat & Plants', icon: <div className="text-xl">🍗</div> },
                    { id: 'Vegetarian', label: 'Vegetarian', desc: 'No meat', icon: <Leaf className="w-6 h-6" /> },
                    { id: 'Vegan', label: 'Vegan', desc: 'Plant-based only', icon: <Leaf className="w-6 h-6 text-green-600" /> },
                    { id: 'Flexitarian', label: 'Flexitarian', desc: 'Mostly plants, occasional meat', icon: <Heart className="w-6 h-6" /> },
                ];
                return (
                    <div className="space-y-4">
                        {renderHeader("Your Food Philosophy", "What is your primary dietary approach?")}
                        {dietOptions.map((item, index) => (
                            <div key={item.id} className={`animate-card-entrance onboard-stagger-${Math.min(index + 1, 8)}`}>
                                {renderOptionCard(
                                    item.label,
                                    item.desc,
                                    profile.dietaryApproach === item.id,
                                    () => updateProfile({ dietaryApproach: item.id as UserProfile['dietaryApproach'] }),
                                    item.icon,
                                    false
                                )}
                            </div>
                        ))}
                    </div>
                );

            // HEALTH (Conditions)
            case 'health':
                const healthOptions = [
                    { id: 'diabetes', label: 'Type 2 Diabetes / Pre-diabetes', icon: <Droplet className="w-6 h-6" /> },
                    { id: 'heart', label: 'Heart Health (Hypertension)', icon: <Heart className="w-6 h-6" /> },
                    { id: 'obesity', label: 'Obesity Management', icon: <Scale className="w-6 h-6" /> },
                    { id: 'cholesterol', label: 'High Cholesterol', icon: <Activity className="w-6 h-6" /> },
                    { id: 'kidney', label: 'Kidney Health', icon: <Activity className="w-6 h-6" /> },
                ];
                return (
                    <div className="space-y-4">
                        {renderHeader("Health Profile", "Are you cooking for anyone with specific medical conditions?")}
                        {healthOptions.map((item, index) => (
                            <div key={item.id} className={`animate-card-entrance onboard-stagger-${Math.min(index + 1, 8)}`}>
                                {renderOptionCard(
                                    item.label,
                                    null,
                                    profile.healthConditions?.includes(item.id) || false,
                                    () => toggleSelection('healthConditions', item.id),
                                    item.icon,
                                    true
                                )}
                            </div>
                        ))}
                    </div>
                );

            // GOALS
            case 'goals':
                const goalOptions = [
                    { id: 'weight_loss', label: 'Sustainable Weight Loss', icon: <Scale className="w-8 h-8" /> },
                    { id: 'blood_sugar', label: 'Manage Blood Sugar', icon: <Activity className="w-8 h-8" /> },
                    { id: 'muscle', label: 'Muscle Gain & Strength', icon: <div className="text-3xl">💪</div> },
                    { id: 'waste', label: 'Reduce Food Waste', icon: <Leaf className="w-8 h-8" /> },
                ];
                return (
                    <div className="space-y-4">
                        {renderHeader("What's Your Goal?", "What are you aiming to achieve with ScanEssen?")}
                        <div className="grid grid-cols-2 gap-4">
                            {goalOptions.map((item, index) => (
                                <div key={item.id} className={`animate-card-entrance onboard-stagger-${index + 1} h-full`}>
                                    <button
                                        onClick={() => toggleSelection('goals', item.id)}
                                        className={clsx(
                                            "w-full h-full min-h-[140px] p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-3 justify-center relative overflow-hidden",
                                            profile.goals?.includes(item.id)
                                                ? "bg-[#6b8e23]/10 border-[#6b8e23] shadow-md"
                                                : "bg-[#f8faf5] border-[#e8ebd9] hover:bg-white"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 mb-2",
                                            profile.goals?.includes(item.id) ? "bg-[#6b8e23] text-white scale-110" : "bg-white text-[#6b8e23]"
                                        )}>
                                            {item.icon}
                                        </div>
                                        <span className="font-bold text-sm text-[#2d3a28] leading-tight">{item.label}</span>
                                        {profile.goals?.includes(item.id) && (
                                            <div className="absolute top-2 right-2 bg-[#6b8e23] rounded-full p-1 animate-scale-in">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-4 bg-white/60 rounded-xl border border-[#e8ebd9] animate-card-entrance onboard-stagger-5">
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
                    </div >
                );

            // KITCHEN
            case 'kitchen':
                const timeOptions = [
                    { id: 'Time Crunch', label: 'Time Crunch', sub: '< 20 mins', icon: <Clock className="w-5 h-5" /> },
                    { id: 'Standard', label: 'Standard', sub: '30-45 mins', icon: <div className="text-lg">👜</div> },
                    { id: 'Project Cook', label: 'Project Cook', sub: '1 hour+', icon: <ChefHat className="w-5 h-5" /> },
                ];
                const confidenceOptions = [
                    { id: 'Beginner', label: 'Beginner', sub: 'Keep it simple' },
                    { id: 'Intermediate', label: 'Intermediate', sub: 'Comfortable' },
                    { id: 'Pro', label: 'Pro', sub: 'Challenge me' },
                ];
                return (
                    <div className="space-y-6">
                        {renderHeader("Your Kitchen Reality", "Let's be real about time and skill.")}
                        <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
                            <h3 className="text-sm font-bold text-[#5c6b57] uppercase tracking-wider mb-3 ml-1">Cooking Time</h3>
                            <div className="space-y-3">
                                {timeOptions.map((item, index) => (
                                    <div key={item.id} className={`flex gap-3 animate-card-entrance onboard-stagger-${index + 1}`}>
                                        <button
                                            onClick={() => updateProfile({ cookingTime: item.id as UserProfile['cookingTime'] })}
                                            className={clsx(
                                                "flex-1 p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-3",
                                                profile.cookingTime === item.id
                                                    ? "bg-[#6b8e23] border-[#6b8e23] text-white shadow-lg scale-[1.02]"
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
                        <div className="animate-fade-up" style={{ animationDelay: '400ms' }}>
                            <h3 className="text-sm font-bold text-[#5c6b57] uppercase tracking-wider mb-3 ml-1">Confidence Level</h3>
                            <div className="flex gap-2">
                                {confidenceOptions.map((item, index) => (
                                    <div key={item.id} className={`flex-1 animate-card-entrance onboard-stagger-${index + 4}`}>
                                        <button
                                            onClick={() => updateProfile({ cookingConfidence: item.id as UserProfile['cookingConfidence'] })}
                                            className={clsx(
                                                "w-full h-full p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center text-center gap-1 min-h-[100px]",
                                                profile.cookingConfidence === item.id
                                                    ? "bg-[#f0f4e8] border-[#6b8e23] shadow-inner scale-[1.02]"
                                                    : "bg-white border-[#e8ebd9] hover:bg-[#f8faf5]"
                                            )}
                                        >
                                            <span className={clsx("font-bold text-sm", profile.cookingConfidence === item.id ? "text-[#6b8e23]" : "text-gray-700")}>
                                                {item.label}
                                            </span>
                                            <span className="text-[10px] text-gray-400 leading-tight">{item.sub}</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            // THE BASICS (Age + Sex)
            case 'age':
                return (
                    <div className="space-y-6">
                        {renderHeader("The Basics", "This helps us calculate nutritional baselines accurately.")}

                        {/* Age Selection */}
                        <div className="bg-white p-6 rounded-2xl border border-[#e8ebd9] shadow-sm animate-card-entrance onboard-stagger-1">
                            <h3 className="text-lg font-bold text-[#2d3a28] mb-4">Age</h3>
                            <div className="flex items-center justify-center gap-6">
                                <button
                                    onClick={() => updateProfile({ age: Math.max(1, (profile.age || 30) - 1) })}
                                    className="w-12 h-12 rounded-full bg-[#f0f4e8] text-[#6b8e23] flex items-center justify-center hover:bg-[#e2e8d4] transition-all active:scale-90 text-xl font-bold"
                                >-</button>
                                <span className="text-5xl font-black text-[#2d3a28] w-20 text-center transition-all">
                                    {profile.age || '--'}
                                </span>
                                <button
                                    onClick={() => updateProfile({ age: (profile.age || 30) + 1 })}
                                    className="w-12 h-12 rounded-full bg-[#f0f4e8] text-[#6b8e23] flex items-center justify-center hover:bg-[#e2e8d4] transition-all active:scale-90 text-xl font-bold"
                                >+</button>
                            </div>
                        </div>

                        {/* Biological Sex Selection */}
                        <div className="bg-white p-6 rounded-2xl border border-[#e8ebd9] shadow-sm animate-card-entrance onboard-stagger-2">
                            <h3 className="text-lg font-bold text-[#2d3a28] mb-4">Biological Sex</h3>
                            <div className="flex gap-2">
                                {['Female', 'Male', 'Prefer not to say'].map((option, index) => (
                                    <button
                                        key={option}
                                        onClick={() => updateProfile({ sex: option as UserProfile['sex'] })}
                                        className={clsx(
                                            "flex-1 py-3 px-2 rounded-xl text-sm font-bold transition-all border-2 duration-300",
                                            profile.sex === option
                                                ? "bg-[#6b8e23] border-[#6b8e23] text-white scale-[1.02]"
                                                : "bg-white border-[#e8ebd9] text-gray-600 hover:border-[#cbd5e1]",
                                            `onboard-stagger-${index + 3}`
                                        )}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            // DISEASES
            case 'diseases':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                        {renderHeader("Health Awareness", "Select or type any medical conditions. This strictly locks restricted foods.")}
                        <div className="bg-white p-6 rounded-2xl border border-[#e8ebd9] shadow-sm">
                            <h3 className="text-sm font-bold text-[#5c6b57] uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-red-500" />
                                Medical Conditions
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Type other disease..."
                                        className="flex-1 p-3 rounded-xl border border-[#e8ebd9] outline-none focus:border-[#6b8e23] transition-all"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = (e.currentTarget as HTMLInputElement).value.trim();
                                                if (val) {
                                                    toggleSelection('healthConditions', val);
                                                    (e.currentTarget as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {COMMON_DISEASES.map(disease => (
                                        <button
                                            key={disease}
                                            onClick={() => toggleSelection('healthConditions', disease)}
                                            className={clsx(
                                                "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                                profile.healthConditions?.includes(disease)
                                                    ? "bg-[#6b8e23] border-[#6b8e23] text-white shadow-md shadow-green-200"
                                                    : "bg-[#f8faf7] border-[#e8ebd9] text-[#5c6b57] hover:border-[#6b8e23]"
                                            )}
                                        >
                                            {disease}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                                    {profile.healthConditions?.filter(d => !COMMON_DISEASES.includes(d)).map(disease => (
                                        <div
                                            key={disease}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm"
                                        >
                                            {disease}
                                            <button
                                                onClick={() => toggleSelection('healthConditions', disease)}
                                                className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] hover:bg-amber-300"
                                            >×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            // REGION
            case 'region':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                        {renderHeader("Location & Language", "Customize your recommendations and video language.")}
                        <div className="bg-white p-6 rounded-2xl border border-[#e8ebd9] shadow-sm">
                            <h3 className="text-sm font-bold text-[#5c6b57] uppercase tracking-wider mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Select Your State
                            </h3>
                            <div className="relative">
                                <select
                                    value={profile.state || ""}
                                    onChange={(e) => updateProfile({ state: e.target.value })}
                                    className="w-full p-4 rounded-xl border-2 border-[#e8ebd9] bg-white text-[#2d3a28] font-bold outline-none focus:border-[#6b8e23] transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Choose a state...</option>
                                    {INDIAN_STATES.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6b8e23]">
                                    <ChevronRight className="w-5 h-5 rotate-90" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-[#e8ebd9] shadow-sm">
                            <h3 className="text-sm font-bold text-[#5c6b57] uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Video Language Preference
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'Hindi', label: 'Hindi' },
                                    { id: 'English', label: 'English' },
                                    { id: 'Tamil', label: 'Tamil' },
                                    { id: 'Telugu', label: 'Telugu' },
                                    { id: 'Gujarati', label: 'Gujarati' },
                                ].map((lang) => (
                                    <button
                                        key={lang.id}
                                        onClick={() => updateProfile({ preferredLanguage: lang.id as UserProfile['preferredLanguage'] })}
                                        className={clsx(
                                            "p-3 rounded-xl border-2 transition-all font-bold text-sm",
                                            profile.preferredLanguage === lang.id
                                                ? "bg-[#6b8e23] border-[#6b8e23] text-white shadow-md"
                                                : "bg-[#f8faf5] border-[#e8ebd9] text-gray-700 hover:bg-white"
                                        )}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );


            // PREVIEW (Animated Chart)
            case 'preview':
                // Calculate a projected improvement based on goals
                const hasWeightGoal = profile.goals?.includes('weight_loss');
                const startWeight = 154.0;
                const endWeight = hasWeightGoal ? 148.0 : 152.0;

                return (
                    <div className="space-y-6">
                        <div className="text-center mb-4 animate-fade-up">
                            <h1 className="text-2xl font-bold text-[#2d3a28] mb-2">Based on your profile, you&apos;ll reach</h1>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-[#e8ebd9] shadow-lg animate-scale-in" style={{ animationDelay: '300ms' }}>
                            <AnimatedProgressChart
                                startValue={startWeight}
                                endValue={endWeight}
                                startLabel="Today"
                                endLabel="Jan 31"
                                unit="lbs"
                                delay={600}
                            />
                        </div>

                        <div className="text-center animate-fade-up" style={{ animationDelay: '2500ms' }}>
                            <h2 className="text-2xl font-black text-[#2d3a28] mb-2">Great Start!</h2>
                            <p className="text-gray-600">
                                With your body data in mind, let&apos;s elevate your custom plan for even better results.
                            </p>
                        </div>
                    </div>
                );

            // COMPLETE (Celebration)
            case 'complete':
                return (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        {showConfetti && <Confetti />}

                        {/* Logo Pop-up */}
                        <div className="relative mb-10">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#6b8e23] via-[#8fbc5a] to-[#6b8e23] flex items-center justify-center shadow-2xl animate-logo-bounce">
                                <Leaf className="w-14 h-14 text-white drop-shadow-lg" />
                            </div>
                            {/* Outer glow rings */}
                            <div className="absolute inset-0 w-28 h-28 rounded-full bg-[#6b8e23]/20 animate-celebration-burst" />
                            <div className="absolute inset-[-8px] w-[calc(100%+16px)] h-[calc(100%+16px)] rounded-full border-2 border-[#6b8e23]/30 animate-celebration-burst" style={{ animationDelay: '200ms' }} />
                        </div>

                        {/* App Name - Word by Word */}
                        <div className="mb-6">
                            <h1 className="text-5xl font-black text-[#2d3a28] tracking-tight">
                                <span className="inline-block animate-scale-in" style={{ animationDelay: '300ms' }}>Scan</span>
                                <span className="inline-block animate-scale-in text-[#6b8e23]" style={{ animationDelay: '500ms' }}>Essen</span>
                            </h1>
                        </div>

                        {/* Tagline with typewriter-style reveal */}
                        <div className="mb-8 overflow-hidden">
                            <p className="text-xl font-medium text-[#5c6b57] animate-fade-up" style={{ animationDelay: '800ms' }}>
                                <span className="inline-block">&quot;Don&apos;t just open it,</span>
                                <span className="inline-block ml-1 text-[#c05621] font-bold animate-scale-in" style={{ animationDelay: '1100ms' }}>scan it&quot;</span>
                            </p>
                        </div>

                        {/* Divider line */}
                        <div className="w-16 h-1 bg-gradient-to-r from-transparent via-[#6b8e23] to-transparent rounded-full mb-6 animate-fade-up" style={{ animationDelay: '1200ms' }} />

                        {/* Success message */}
                        <div className="flex items-center gap-2 text-[#6b8e23] animate-fade-up" style={{ animationDelay: '1400ms' }}>
                            <div className="w-6 h-6 rounded-full bg-[#6b8e23] flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold">You&apos;re all set!</span>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const getButtonText = () => {
        switch (currentStep) {
            case 'welcome': return "Let's Go!";
            case 'complete': return 'Start Cooking';
            case 'preview': return 'Finish Setup';
            default: return 'Continue';
        }
    };

    const showBackButton = currentStepIndex > 0 && currentStep !== 'complete';
    const showProgress = currentStep !== 'welcome' && currentStep !== 'complete';

    return (
        <div className="min-h-[100dvh] w-full bg-[#f4f7f0] flex flex-col items-center p-6 font-sans">
            <div className="w-full max-w-md flex flex-col h-full flex-1">
                {/* Top Logo (hidden on welcome/complete) */}
                {showProgress && (
                    <div className="w-full flex justify-center py-4 mb-4 animate-fade-up">
                        <span className="text-2xl font-bold text-[#2d3a28] flex items-center gap-2">
                            <Leaf className="w-6 h-6 text-[#6b8e23]" />
                            ScanEssen
                        </span>
                    </div>
                )}

                {showProgress && renderProgressBar()}

                <div
                    key={stepKey}
                    className="flex-1 overflow-y-auto pb-24 px-1 transition-all duration-300 animate-fade-in"
                >
                    {renderStepContent()}
                </div>

                <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 safe-area-pb">
                    <div className={clsx("max-w-md mx-auto flex items-center gap-4", !showBackButton ? "justify-center" : "justify-between")}>
                        {showBackButton && (
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[#5c6b57] transition-all duration-300 hover:bg-[#f0f4e8] active:scale-95"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Back
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            disabled={!isStepValid(currentStep)}
                            className={clsx(
                                "flex-1 bg-[#c05621] hover:bg-[#9c4221] active:bg-[#7b341e] text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95",
                                currentStep === 'complete' && "bg-[#6b8e23] hover:bg-[#5a7a1e]"
                            )}
                        >
                            {getButtonText()}
                            {currentStep !== 'complete' && <ChevronRight className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
