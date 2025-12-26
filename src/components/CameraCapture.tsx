"use client";

import { Camera } from "lucide-react";

interface CameraCaptureProps {
    onImageSelected: (base64: string) => void;
}

export default function CameraCapture({ onImageSelected }: CameraCaptureProps) {
    const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                onImageSelected(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="relative">
            <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapture}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                id="camera-input"
            />
            <label
                htmlFor="camera-input"
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-black transition-transform active:scale-95 cursor-pointer"
            >
                <Camera className="w-5 h-5" />
                <span className="font-bold">Take Photo</span>
            </label>
        </div>
    );
}
