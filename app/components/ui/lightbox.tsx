"use client";

import React from "react";
import { X } from "lucide-react";

export interface LightboxProps {
    images: string[];
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export function Lightbox({ images, initialIndex = 0, isOpen, onClose }: LightboxProps) {
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

    React.useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex, isOpen]);

    if (!isOpen || images.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-panel-border/50 hover:bg-panel-border rounded-full text-white transition-colors"
            >
                <X size={24} />
            </button>

            <div className="relative max-w-5xl max-h-full flex items-center justify-center">
                {/* We use a standard img tag with object-contain to allow zooming (via browser) or just viewing large */}
                <img
                    src={images[currentIndex]}
                    alt={`Service Evidence ${currentIndex + 1}`}
                    className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
                />
            </div>

            {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-full p-2 bg-black/50 rounded-xl">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${idx === currentIndex ? 'border-primary' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        >
                            <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
