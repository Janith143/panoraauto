"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui";
import { History, Wrench, AlertTriangle, FileText, CheckCircle, FileImage } from "lucide-react";
import { Lightbox } from "@/app/components/ui/lightbox";

export default function PublicVehicleProfile() {
    const params = useParams();
    const token = params.token as string;
    const [vehicle, setVehicle] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Lightbox state
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const res = await fetch(`/api/public/vehicles/${token}`);
                if (!res.ok) {
                    throw new Error("Vehicle profile not found or link has expired");
                }
                const data = await res.json();
                setVehicle(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchVehicle();
        }
    }, [token]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading vehicle profile...</div>;

    if (error || !vehicle) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <AlertTriangle size={48} className="text-warning mb-4" />
                <h1 className="text-2xl font-bold mb-2">Profile Unavailable</h1>
                <p className="text-foreground/70 text-center max-w-md">{error}</p>
            </div>
        );
    }

    const openLightbox = (images: string[], index: number = 0) => {
        setLightboxImages(images);
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Lightbox
                isOpen={lightboxOpen}
                images={lightboxImages}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
            />

            {/* Header Area */}
            <div className="bg-panel border-b border-panel-border pt-12 pb-8 px-6 lg:px-8">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-background border-2 border-panel-border shrink-0">
                        {vehicle.photo ? (
                            <img src={vehicle.photo} alt={vehicle.model} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-foreground/30">
                                <FileText size={40} />
                            </div>
                        )}
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-widest mb-3">
                            Verified Profile
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
                            {vehicle.make} {vehicle.model}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-foreground/50">
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary/70"></span> {vehicle.year}</span>
                            <span className="flex items-center gap-2 font-mono uppercase tracking-widest"><span className="w-2 h-2 rounded-full bg-foreground/30"></span> {vehicle.plate}</span>
                            {vehicle.vin && (
                                <span className="flex items-center gap-2 font-mono uppercase tracking-widest group">
                                    <span className="w-2 h-2 rounded-full bg-warning/70"></span> VIN: {vehicle.vin}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 lg:px-8 mt-8 space-y-8">
                {/* Odometer Section */}
                {vehicle.currentOdo !== undefined && (
                    <Card>
                        <CardHeader className="pb-4 border-b border-panel-border">
                            <CardTitle className="text-sm text-foreground/50 uppercase tracking-widest font-semibold flex items-center gap-2">
                                <History size={16} /> Basic Health & Odometer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-xs text-foreground/50 uppercase font-bold mb-2">Verified Odometer</p>
                                    <div className="text-4xl font-mono font-bold text-primary">
                                        {vehicle.currentOdo.toLocaleString()} <span className="text-sm font-sans font-normal text-foreground/50">km</span>
                                    </div>
                                </div>
                                {vehicle.engineType && (
                                    <div>
                                        <p className="text-xs text-foreground/50 uppercase font-bold mb-2">Engine Type</p>
                                        <div className="text-2xl font-bold">
                                            {vehicle.engineType}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Legal Documents Section */}
                {(vehicle.revenueLicenseDate || vehicle.insuranceDate || vehicle.emissionReportDate) && (
                    <Card>
                        <CardHeader className="pb-4 border-b border-panel-border">
                            <CardTitle className="text-sm text-foreground/50 uppercase tracking-widest font-semibold flex items-center gap-2">
                                <FileText size={16} /> Legal & Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between items-center border-b border-panel-border pb-3 hover:bg-panel/30 -mx-2 px-2 rounded transition-colors group">
                                <span className="text-sm text-foreground/70">Rev. License</span>
                                <span className={!vehicle.revenueLicenseDate ? "text-warning text-sm font-bold flex items-center gap-2" : "text-sm text-foreground font-mono flex items-center gap-2"}>
                                    {vehicle.revenueLicensePhoto && <FileImage size={14} className="text-primary cursor-pointer hover:text-primary/70" onClick={() => openLightbox([vehicle.revenueLicensePhoto])} />}
                                    {vehicle.revenueLicenseDate ? new Date(vehicle.revenueLicenseDate).toLocaleDateString() : "Not Set"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-3 hover:bg-panel/30 -mx-2 px-2 rounded transition-colors group">
                                <span className="text-sm text-foreground/70">Insurance</span>
                                <span className={!vehicle.insuranceDate ? "text-warning text-sm font-bold flex items-center gap-2" : "text-sm text-foreground font-mono flex items-center gap-2"}>
                                    {vehicle.insurancePhoto && <FileImage size={14} className="text-primary cursor-pointer hover:text-primary/70" onClick={() => openLightbox([vehicle.insurancePhoto])} />}
                                    {vehicle.insuranceDate ? new Date(vehicle.insuranceDate).toLocaleDateString() : "Not Set"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-t border-panel-border pt-3 hover:bg-panel/30 -mx-2 px-2 rounded transition-colors group">
                                <span className="text-sm text-foreground/70">Emission Report</span>
                                <span className={!vehicle.emissionReportDate ? "text-warning text-sm font-bold flex items-center gap-2" : "text-sm text-foreground font-mono flex items-center gap-2"}>
                                    {vehicle.emissionReportPhoto && <FileImage size={14} className="text-primary cursor-pointer hover:text-primary/70" onClick={() => openLightbox([vehicle.emissionReportPhoto])} />}
                                    {vehicle.emissionReportDate ? new Date(vehicle.emissionReportDate).toLocaleDateString() : "Not Set"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Maintenance History Section */}
                {vehicle.bills && (
                    <Card>
                        <CardHeader className="pb-4 border-b border-panel-border">
                            <CardTitle className="text-sm text-foreground/50 uppercase tracking-widest font-semibold flex items-center gap-2">
                                <Wrench size={16} /> Verified Maintenance History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="relative border-l-2 border-panel-border ml-4 space-y-8 pb-4">
                                {vehicle.bills.map((bill: any, index: number) => {
                                    const isDocumentUpload = bill.notes?.includes("System Log:");
                                    const nextBillWithOdo = vehicle.bills.slice(index + 1).find((b: any) => b.odometer !== undefined && b.odometer !== null);
                                    const prevOdo = nextBillWithOdo ? nextBillWithOdo.odometer : undefined;

                                    let colorClass = "text-primary bg-primary/10 border-primary/20";
                                    let icon = null;

                                    if (prevOdo !== undefined && bill.odometer !== undefined && bill.odometer !== null) {
                                        if (bill.odometer > prevOdo) {
                                            colorClass = "text-success bg-success/10 border-success/30";
                                            icon = <span className="text-[10px]">▲</span>;
                                        }
                                    }

                                    return (
                                        <div key={bill.id} className="relative pl-8">
                                            <div className="absolute w-4 h-4 bg-primary rounded-full -left-[9px] top-1 outline outline-4 outline-background shadow-[0_0_10px_rgba(0,119,182,0.5)]"></div>
                                            <div className="bg-panel/50 border border-panel-border p-4 rounded-xl">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-lg text-foreground">
                                                            {isDocumentUpload ? 'Document Upload' : (bill.source === 'garage' ? 'Garage Service' : 'DIY Maintenance')}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <p className="text-sm text-foreground/50">
                                                                {new Date(bill.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                            </p>
                                                            {bill.odometer !== undefined && bill.odometer !== null && (
                                                                <p className={`text-xs font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${colorClass}`}>
                                                                    {icon} {bill.odometer.toLocaleString()} km
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {bill.source === 'garage' && (
                                                        <div className="flex items-center gap-1 text-xs text-success font-medium bg-success/10 px-2 py-1 rounded-md border border-success/20">
                                                            <CheckCircle size={12} /> Verified
                                                        </div>
                                                    )}
                                                </div>

                                                {(bill.items && bill.items.length > 0) && (
                                                    <div className="bg-background rounded-lg p-2 border border-panel-border/50">
                                                        <ul className="space-y-1">
                                                            {bill.items.map((item: any, idx: number) => (
                                                                <li key={idx} className="flex justify-between text-xs items-center px-1 py-0.5">
                                                                    <span className="text-foreground/80">• {item.name}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {bill.notes && (
                                                    <div className="mt-2 bg-background/50 rounded-lg p-3 text-sm border border-panel-border/30">
                                                        <p className="text-foreground/50 text-xs uppercase font-bold mb-1 tracking-wider">Notes</p>
                                                        <p className="text-foreground/80">{bill.notes}</p>
                                                    </div>
                                                )}

                                                {bill.photos && bill.photos.length > 0 && (
                                                    <div className="mt-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {bill.photos.map((photo: string, idx: number) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => openLightbox(bill.photos, idx)}
                                                                    className="w-16 h-16 rounded-lg overflow-hidden border border-panel-border hover:border-primary transition-all cursor-zoom-in"
                                                                >
                                                                    <img src={photo} alt="Service Evidence" className="w-full h-full object-cover" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {vehicle.bills.length === 0 && (
                                    <div className="pl-8 text-foreground/40 italic">
                                        No maintenance records found.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="text-center mt-12 text-foreground/40 text-xs flex flex-col items-center justify-center gap-2 pb-8">
                <span>Verified by Autolog Connect</span>
            </div>
        </div>
    );
}
