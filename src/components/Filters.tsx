"use client";

import { useState } from "react";
import clsx from "clsx";
import { Utensils, Settings2 } from "lucide-react";

interface FiltersProps {
    cuisine: string;
    setCuisine: (c: string) => void;
    equipment: string[];
    setEquipment: (e: string[]) => void;
}

const CUISINES = ["Any", "Italian", "Mexican", "Asian", "Mediterranean", "American", "Indian"];
const EQUIPMENT = ["Oven", "Stove", "Microwave", "Air Fryer", "Blender"];

export default function Filters({ cuisine, setCuisine, equipment, setEquipment }: FiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleEquipment = (item: string) => {
        if (equipment.includes(item)) {
            setEquipment(equipment.filter((e) => e !== item));
        } else {
            setEquipment([...equipment, item]);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-gray-700 font-medium w-full hover:text-primary transition-colors"
            >
                <Settings2 className="w-5 h-5 text-secondary" />
                Customize Recipe (Cuisine & Tools)
                <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                    {isOpen ? "Close" : "Expand"}
                </span>
            </button>

            {isOpen && (
                <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                    {/* Cuisine */}
                    <div>
                        <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider block mb-2">
                            Vibe (Cuisine)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CUISINES.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCuisine(c)}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                        cuisine === c
                                            ? "bg-primary text-white shadow-md shadow-primary/20"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    )}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Equipment */}
                    <div>
                        <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider block mb-2">
                            Equipment Available
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {EQUIPMENT.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => toggleEquipment(item)}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                                        equipment.includes(item)
                                            ? "border-secondary bg-secondary/10 text-secondary-hover"
                                            : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                                    )}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
