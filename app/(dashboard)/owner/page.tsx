"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useVehicles, ServiceItem } from "@/app/context/VehicleContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, HealthBar, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/app/components/ui";
import { Lightbox } from "@/app/components/ui/lightbox";
import { Plus, Trash2, FileText, X, Loader2, Car, Clock } from "lucide-react";
export default function OwnerDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const { vehicles, parts, bills, approveBill, addManualRecord, updateOdometer, addVehicle, loading: vehiclesLoading } = useVehicles();
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [newOdoValues, setNewOdoValues] = useState<Record<string, string>>({});

    // Lightbox state
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Pending Edits state
    const [pendingEdits, setPendingEdits] = useState<Record<string, { notes: string, odometer: string, items?: ServiceItem[], amount?: number }>>({});

    // Add Vehicle Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        plate: "",
        currentOdo: 0
    });

    // Removed redundant local fetch since VehicleContext now handles it globally

    if (vehiclesLoading) return null;

    const handleUpdate = (vehicleId: string) => {
        const val = parseInt(newOdoValues[vehicleId], 10);
        if (!isNaN(val)) {
            updateOdometer(vehicleId, val);
            setUpdatingId(null);
            setNewOdoValues(prev => ({ ...prev, [vehicleId]: "" }));
        }
    };

    const openLightbox = (images: string[], index: number = 0) => {
        setLightboxImages(images);
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const handleApprove = async (billId: string) => {
        const edits = pendingEdits[billId];
        const notes = edits?.notes && edits.notes.trim() !== "" ? edits.notes : undefined;
        let odometer = undefined;
        if (edits?.odometer) {
            const parsed = parseInt(edits.odometer, 10);
            if (!isNaN(parsed)) odometer = parsed;
        }

        const items = edits?.items;
        const amount = edits?.amount;

        await approveBill(billId, notes, odometer, items, amount);

        setPendingEdits(prev => {
            const next = { ...prev };
            delete next[billId];
            return next;
        });
    };

    // Removed generic cross-vehicle logging handlers

    const handleAddVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addVehicle(newVehicle);
            setShowAddModal(false);
            setNewVehicle({ make: "", model: "", year: new Date().getFullYear(), plate: "", currentOdo: 0 });
        } catch (err: any) {
            console.error("Caught Exception adding vehicle:", err);
            alert(`Failed to add vehicle: ${err.message || "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const myVehicles = vehicles.filter(v => v.ownerId === user?.id);
    const myPendingBills = bills ? bills.filter(b => b.status === 'pending' && myVehicles.some(v => v.id === b.vehicleId)) : [];

    return (
        <div className="space-y-6">
            <Lightbox
                isOpen={lightboxOpen}
                images={lightboxImages}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Vehicle Fleet</h2>
                    <p className="text-foreground/70">Welcome back, {user?.name}. Manage your vehicles here.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="primary" onClick={() => setShowAddModal(true)}>Add Vehicle</Button>
                </div>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <Card className="w-full max-w-md bg-panel border-panel-border shadow-2xl animate-in zoom-in-95">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div>
                                <CardTitle>Register Vehicle</CardTitle>
                                <CardDescription>Add a new vehicle to your fleet.</CardDescription>
                            </div>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddVehicle} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Make</label>
                                        <Input required placeholder="Toyota" value={newVehicle.make} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVehicle({ ...newVehicle, make: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Model</label>
                                        <Input required placeholder="Tacoma" value={newVehicle.model} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVehicle({ ...newVehicle, model: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Year</label>
                                        <Input required type="number" min="1950" max={new Date().getFullYear() + 1} value={newVehicle.year} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">License Plate</label>
                                        <Input required placeholder="XYZ-1234" className="uppercase font-mono" value={newVehicle.plate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVehicle({ ...newVehicle, plate: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Current Odometer (km)</label>
                                    <Input required type="number" min="0" placeholder="0" value={newVehicle.currentOdo || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVehicle({ ...newVehicle, currentOdo: parseInt(e.target.value) })} />
                                </div>
                                <Button type="submit" variant="primary" className="w-full mt-2" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                                    Save Vehicle
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Generic Manual Logging Moved */}

            {/* Dashboard Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <Card className="bg-panel/50 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-foreground/70 uppercase flex items-center gap-2">
                            <Car size={16} /> Total Vehicles
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{myVehicles.length}</div>
                    </CardContent>
                </Card>

                <Card
                    className="bg-panel/50 border-warning/30 hover:bg-warning/10 transition-colors cursor-pointer"
                    onClick={() => {
                        const firstNeedingAttention = myVehicles.find(v => {
                            return parts.some(p => {
                                if (p.vehicleId !== v.id) return false;
                                const used = v.currentOdo - p.lastServiceOdo;
                                const odoDue = p.lifespanOdo > 0 && (used / p.lifespanOdo) >= 0.85;
                                let timeDue = false;
                                if (p.lifespanMonths && p.lastServiceDate) {
                                    const lastDate = new Date(p.lastServiceDate);
                                    const now = new Date();
                                    const monthsElapsed = (now.getFullYear() - lastDate.getFullYear()) * 12 + now.getMonth() - lastDate.getMonth();
                                    timeDue = (monthsElapsed / p.lifespanMonths) >= 0.85;
                                }
                                return odoDue || timeDue;
                            });
                        });
                        if (firstNeedingAttention) {
                            router.push(`/owner/vehicle/${firstNeedingAttention.id}`);
                        }
                    }}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-warning uppercase flex items-center gap-2">
                            <Clock size={16} /> Items Needing Attention
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-warning">
                            {myVehicles.reduce((total, v) => {
                                return total + parts.filter(p => {
                                    if (p.vehicleId !== v.id) return false;
                                    const used = v.currentOdo - p.lastServiceOdo;
                                    const odoDue = p.lifespanOdo > 0 && (used / p.lifespanOdo) >= 0.85;
                                    let timeDue = false;
                                    if (p.lifespanMonths && p.lastServiceDate) {
                                        const lastDate = new Date(p.lastServiceDate);
                                        const now = new Date();
                                        const monthsElapsed = (now.getFullYear() - lastDate.getFullYear()) * 12 + now.getMonth() - lastDate.getMonth();
                                        timeDue = (monthsElapsed / p.lifespanMonths) >= 0.85;
                                    }
                                    return odoDue || timeDue;
                                }).length;
                            }, 0)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-panel/50 border-alert/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-alert uppercase flex items-center gap-2">
                            <FileText size={16} /> Pending Garage Approvals
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-alert">{myPendingBills.length}</div>
                    </CardContent>
                </Card>
            </div>

            {myPendingBills.length > 0 && (
                <Card className="border-warning/50 bg-warning/5">
                    <CardHeader>
                        <CardTitle className="text-warning">Pending Garage Approvals</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {myPendingBills.map(bill => {
                            const edits = pendingEdits[bill.id] || { notes: "", odometer: bill.odometer?.toString() || "" };

                            return (
                                <div key={bill.id} className="flex flex-col p-4 bg-panel border border-panel-border rounded-xl gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                                        <div className="flex-1">
                                            <div className="font-bold text-lg mb-1 flex items-center gap-2">
                                                {bill.items[0]?.name || 'Service'}
                                                {bill.items.length > 1 && <span className="text-xs font-normal text-foreground/50 bg-background px-2 py-0.5 rounded-full border border-panel-border">+{bill.items.length - 1} items</span>}
                                            </div>
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="text-foreground/70 font-mono text-xl">Rs {bill.amount.toFixed(2)}</div>
                                            </div>

                                            {/* Editable Items List */}
                                            <div className="mb-4 space-y-2">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h5 className="text-sm font-semibold">Service Details</h5>
                                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => {
                                                        const currentItems = edits.items || bill.items;
                                                        setPendingEdits({ ...pendingEdits, [bill.id]: { ...edits, items: [...currentItems, { name: "", price: 0 }] } });
                                                    }}>
                                                        <Plus size={12} className="mr-1" /> Add Line
                                                    </Button>
                                                </div>
                                                {(edits.items || bill.items).map((item, idx) => (
                                                    <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-background/50 p-2 rounded-lg border border-panel-border/50">
                                                        <Input
                                                            value={item.name}
                                                            placeholder="Service/Part Name"
                                                            className="h-8 text-sm flex-1"
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                const newItems = [...(edits.items || bill.items)];
                                                                newItems[idx] = { ...item, name: e.target.value };
                                                                const newAmount = newItems.reduce((sum, i) => sum + (i.price || 0), 0);
                                                                setPendingEdits({ ...pendingEdits, [bill.id]: { ...edits, items: newItems, amount: newAmount } });
                                                            }}
                                                        />
                                                        <div className="flex gap-2 w-full sm:w-auto">
                                                            <Input
                                                                type="number"
                                                                placeholder="Life(km)"
                                                                value={item.lifespanOdo || ""}
                                                                className="h-8 text-xs font-mono w-24"
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                    const newItems = [...(edits.items || bill.items)];
                                                                    newItems[idx] = { ...item, lifespanOdo: e.target.value ? parseInt(e.target.value) : undefined };
                                                                    setPendingEdits({ ...pendingEdits, [bill.id]: { ...edits, items: newItems } });
                                                                }}
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Life(mo)"
                                                                value={item.lifespanMonths || ""}
                                                                className="h-8 text-xs font-mono w-24"
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                    const newItems = [...(edits.items || bill.items)];
                                                                    newItems[idx] = { ...item, lifespanMonths: e.target.value ? parseInt(e.target.value) : undefined };
                                                                    setPendingEdits({ ...pendingEdits, [bill.id]: { ...edits, items: newItems } });
                                                                }}
                                                            />
                                                            <div className="flex items-center gap-1 bg-background border border-panel-border rounded-md px-2 flex-1 sm:w-28">
                                                                <span className="text-foreground/50 text-sm">Rs</span>
                                                                <input
                                                                    type="number"
                                                                    className="bg-transparent border-none outline-none w-full text-sm font-mono"
                                                                    value={item.price === 0 && !item.name ? "" : item.price}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                        const newItems = [...(edits.items || bill.items)];
                                                                        newItems[idx] = { ...item, price: parseFloat(e.target.value) || 0 };
                                                                        const newAmount = newItems.reduce((sum, i) => sum + (i.price || 0), 0);
                                                                        setPendingEdits({ ...pendingEdits, [bill.id]: { ...edits, items: newItems, amount: newAmount } });
                                                                    }}
                                                                />
                                                            </div>
                                                            <button className="text-alert/50 hover:text-alert p-1" onClick={() => {
                                                                const newItems = (edits.items || bill.items).filter((_, i) => i !== idx);
                                                                const newAmount = newItems.reduce((sum, i) => sum + (i.price || 0), 0);
                                                                setPendingEdits({ ...pendingEdits, [bill.id]: { ...edits, items: newItems, amount: newAmount } });
                                                            }}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center bg-background/80 p-2 rounded-lg border border-panel-border">
                                                    <span className="font-semibold text-sm">Updated Total</span>
                                                    <span className="font-mono font-bold text-lg">Rs {(edits.amount ?? bill.amount).toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {bill.photos && bill.photos.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {bill.photos.map((photo, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => openLightbox(bill.photos || [], idx)}
                                                            className="w-16 h-16 rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-all cursor-zoom-in"
                                                        >
                                                            <img src={photo} alt="Service evidence" className="w-full h-full object-cover" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-full sm:w-auto flex flex-col gap-3 min-w-[260px]">
                                            <div className="bg-background/90 p-3 rounded-lg border border-panel-border space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1 text-foreground/70">Confirm Odometer</label>
                                                    <Input
                                                        type="number"
                                                        placeholder="Mileage (km)"
                                                        className="h-8 text-sm"
                                                        value={edits.odometer}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPendingEdits({ ...pendingEdits, [bill.id]: { ...edits, odometer: e.target.value } })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium mb-1 text-foreground/70">Add Personal Notes</label>
                                                    <Input
                                                        placeholder="My notes..."
                                                        className="h-8 text-sm"
                                                        value={edits.notes}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPendingEdits({ ...pendingEdits, [bill.id]: { ...edits, notes: e.target.value } })}
                                                    />
                                                </div>
                                                <Button variant="primary" className="bg-success hover:bg-success/80 text-white w-full h-9 flex items-center justify-center gap-2" onClick={() => handleApprove(bill.id)}>
                                                    Approve & Save
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {myVehicles.map(vehicle => {
                    const vehicleParts = parts.filter(p => p.vehicleId === vehicle.id);
                    const needsMaintenance = vehicleParts.some(p => {
                        const used = vehicle.currentOdo - p.lastServiceOdo;
                        const odoDue = p.lifespanOdo > 0 && (used / p.lifespanOdo) >= 0.85; // 15% or less remaining
                        let timeDue = false;
                        if (p.lifespanMonths && p.lastServiceDate) {
                            const lastDate = new Date(p.lastServiceDate);
                            const now = new Date();
                            const monthsElapsed = (now.getFullYear() - lastDate.getFullYear()) * 12 + now.getMonth() - lastDate.getMonth();
                            timeDue = (monthsElapsed / p.lifespanMonths) >= 0.85;
                        }
                        return odoDue || timeDue;
                    });

                    return (
                        <Card key={vehicle.id} className="flex flex-col">
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div className="flex flex-row items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-panel border-2 border-panel-border shrink-0">
                                        {vehicle.photo ? (
                                            <img src={vehicle.photo} alt={vehicle.model} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-primary/50 bg-primary/5">
                                                <Car size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <CardTitle>{vehicle.year} {vehicle.make} {vehicle.model}</CardTitle>
                                        <CardDescription className="font-mono mt-1">{vehicle.plate}</CardDescription>
                                    </div>
                                </div>
                                {needsMaintenance && (
                                    <span className="bg-alert/20 text-alert px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                        Maintenance Due
                                    </span>
                                )}
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-3xl font-mono font-bold text-primary">
                                        {vehicle.currentOdo.toLocaleString()} <span className="text-sm font-sans font-normal text-foreground/50">km</span>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-panel-border">
                                    <h4 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">Part Health Status</h4>
                                    <div className="flex flex-row justify-around gap-4">
                                        {vehicleParts.slice().sort((a, b) => {
                                            const aUsedOdo = vehicle.currentOdo - a.lastServiceOdo;
                                            const aPercOdo = a.lifespanOdo > 0 ? (aUsedOdo / a.lifespanOdo) : 0;
                                            let aPercTime = 0;
                                            if (a.lifespanMonths && a.lastServiceDate) {
                                                const lastDate = new Date(a.lastServiceDate);
                                                const now = new Date();
                                                const monthsElapsed = (now.getFullYear() - lastDate.getFullYear()) * 12 + now.getMonth() - lastDate.getMonth();
                                                aPercTime = a.lifespanMonths > 0 ? (monthsElapsed / a.lifespanMonths) : 0;
                                            }
                                            const aMaxPerc = Math.max(aPercOdo, aPercTime);

                                            const bUsedOdo = vehicle.currentOdo - b.lastServiceOdo;
                                            const bPercOdo = b.lifespanOdo > 0 ? (bUsedOdo / b.lifespanOdo) : 0;
                                            let bPercTime = 0;
                                            if (b.lifespanMonths && b.lastServiceDate) {
                                                const lastDate = new Date(b.lastServiceDate);
                                                const now = new Date();
                                                const monthsElapsed = (now.getFullYear() - lastDate.getFullYear()) * 12 + now.getMonth() - lastDate.getMonth();
                                                bPercTime = b.lifespanMonths > 0 ? (monthsElapsed / b.lifespanMonths) : 0;
                                            }
                                            const bMaxPerc = Math.max(bPercOdo, bPercTime);

                                            return bMaxPerc - aMaxPerc; // Sort descending by criticality
                                        }).slice(0, 3).map(part => {
                                            const currentSpan = vehicle.currentOdo - part.lastServiceOdo;
                                            let currentMonths = 0;
                                            if (part.lifespanMonths && part.lastServiceDate) {
                                                const lastDate = new Date(part.lastServiceDate);
                                                const now = new Date();
                                                currentMonths = (now.getFullYear() - lastDate.getFullYear()) * 12 + now.getMonth() - lastDate.getMonth();
                                            }

                                            return (
                                                <HealthBar
                                                    key={part.id}
                                                    label={part.name}
                                                    currentSpan={currentSpan}
                                                    maxSpan={part.lifespanOdo}
                                                    currentMonths={currentMonths}
                                                    maxMonths={part.lifespanMonths}
                                                    type="circular"
                                                />
                                            );
                                        })}
                                    </div>
                                    {vehicleParts.length > 3 && (
                                        <p className="text-xs text-foreground/50 italic text-right">+ {vehicleParts.length - 3} more parts monitored</p>
                                    )}
                                    {vehicleParts.length === 0 && (
                                        <p className="text-sm text-foreground/40 italic">No parts tracked yet.</p>
                                    )}
                                </div>

                                <Button
                                    className="w-full mt-4 bg-panel-border/30 hover:bg-panel-border/60 transition-colors"
                                    variant="ghost"
                                    onClick={() => router.push(`/owner/vehicle/${vehicle.id}`)}
                                >
                                    View Full Details & History
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
