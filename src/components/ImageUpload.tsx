"use client";

import { useState, useRef } from "react";
import { Upload, X, ChefHat } from "lucide-react";
import clsx from "clsx";
import Image from "next/image";

interface ImageUploadProps {
    onImageSelected: (base64: string) => void;
}

export default function ImageUpload({ onImageSelected }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreview(result);
                onImageSelected(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    if (preview) {
        return (
            <div className="relative rounded-xl overflow-hidden shadow-md border border-gray-200">
                <Image
                    src={preview}
                    alt="Fridge Preview"
                    width={600}
                    height={400}
                    className="w-full h-64 object-cover"
                />
                <button
                    onClick={() => {
                        setPreview(null);
                        onImageSelected("");
                    }}
                    className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white text-gray-700 rounded-full shadow transition-all backdrop-blur-sm"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={clsx(
                "cursor-pointer border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all bg-white",
                dragging ? "border-primary bg-green-50" : "border-gray-300 hover:border-primary hover:bg-gray-50"
            )}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
                Upload Fridge Photo
            </h3>
            <p className="text-sm text-gray-500">
                Drag & drop or click to choose
            </p>
        </div>
    );
}
