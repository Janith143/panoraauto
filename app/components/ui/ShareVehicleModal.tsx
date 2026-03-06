"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, Share2, Globe } from "lucide-react";
import { Button } from "./button";
import { useVehicles } from "@/app/context/VehicleContext";

interface ShareVehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicleId: string;
}

export function ShareVehicleModal({ isOpen, onClose, vehicleId }: ShareVehicleModalProps) {
    const { vehicles, updateVehicle } = useVehicles();
    const vehicle = vehicles.find((v) => v.id === vehicleId);

    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [preferences, setPreferences] = useState({
        showOdometer: true,
        showMaintenanceHistory: true,
        showLegalDocs: false,
    });

    useEffect(() => {
        if (isOpen && vehicle?.sharePreferences) {
            setPreferences((vehicle as any).sharePreferences as any);
        }
    }, [isOpen, vehicle]);

    if (!isOpen || !vehicle) return null;

    const shareToken = (vehicle as any).shareToken;
    const shareUrl = shareToken ? `${window.location.origin}/p/${shareToken}` : null;

    const handleShare = async () => {
        setIsLoading(true);
        try {
            const token = shareToken || Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
            await updateVehicle(vehicle.id, {
                shareToken: token,
                sharePreferences: preferences,
            });
        } catch (error: any) {
            alert(`Failed to update sharing settings: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleUnshare = async () => {
        setIsLoading(true);
        try {
            await updateVehicle(vehicle.id, {
                shareToken: null as any,
                sharePreferences: null as any,
            });
            onClose();
        } catch (error: any) {
            alert(`Failed to unshare: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-panel border border-panel-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-panel-border">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Share2 size={18} className="text-primary" />
                        Share Vehicle Profile
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                        <X size={16} />
                    </Button>
                </div>

                <div className="p-4 space-y-4">
                    <p className="text-sm text-foreground/70">
                        Generate a public link to share your vehicle's details. Select what information should be visible.
                    </p>

                    <div className="bg-background rounded-lg border border-panel-border p-3 space-y-3">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">Odometer & Basic Info</span>
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={preferences.showOdometer} onChange={(e) => setPreferences({ ...preferences, showOdometer: e.target.checked })} />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${preferences.showOdometer ? 'bg-primary' : 'bg-panel-border'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.showOdometer ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">Maintenance History</span>
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={preferences.showMaintenanceHistory} onChange={(e) => setPreferences({ ...preferences, showMaintenanceHistory: e.target.checked })} />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${preferences.showMaintenanceHistory ? 'bg-primary' : 'bg-panel-border'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.showMaintenanceHistory ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">Legal Documents & Photos</span>
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={preferences.showLegalDocs} onChange={(e) => setPreferences({ ...preferences, showLegalDocs: e.target.checked })} />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${preferences.showLegalDocs ? 'bg-alert' : 'bg-panel-border'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.showLegalDocs ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                    </div>

                    {shareToken ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={shareUrl || ""}
                                    readOnly
                                    className="flex-1 bg-background border border-primary/30 rounded-lg px-3 py-2 text-sm text-primary font-mono outline-none"
                                />
                                <Button variant="primary" onClick={handleCopy} className="px-3 shrink-0">
                                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="primary" className="flex-1" onClick={handleShare} disabled={isLoading}>
                                    {isLoading ? "Updating..." : "Update Preferences"}
                                </Button>
                                <Button variant="ghost" className="text-alert border border-alert/20 hover:bg-alert/10" onClick={handleUnshare} disabled={isLoading}>
                                    Disable Link
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="primary" className="w-full h-10" onClick={handleShare} disabled={isLoading}>
                            <Globe size={16} className="mr-2" />
                            {isLoading ? "Creating Link..." : "Generate Public Link"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
