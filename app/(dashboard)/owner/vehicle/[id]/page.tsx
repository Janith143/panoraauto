"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useVehicles, ServiceItem, Bill } from "@/app/context/VehicleContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, HealthBar, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/app/components/ui";
import { Lightbox } from "@/app/components/ui/lightbox";
import { ArrowLeft, History, Wrench, AlertTriangle, CheckCircle, Plus, Trash2, Edit2, FileText, Save, X, Camera } from "lucide-react";

export default function VehicleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { vehicles, parts, bills, updateOdometer, updateVehicleDates, addManualRecord, updateBill, updatePart, deletePart, deleteVehicle, transferVehicle, updateVehiclePhoto, loading } = useVehicles();

    const [updatingOdo, setUpdatingOdo] = useState(false);
    const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferEmail, setTransferEmail] = useState("");
    const [newOdoValue, setNewOdoValue] = useState("");
    const [mainOdoDecreaseReason, setMainOdoDecreaseReason] = useState("");
    const [requireMainOdoReason, setRequireMainOdoReason] = useState(false);

    // Lightbox state
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Registration Dates state
    const [editingDates, setEditingDates] = useState(false);
    const [revDate, setRevDate] = useState("");
    const [insDate, setInsDate] = useState("");
    const [emiDate, setEmiDate] = useState("");

    // Manual Log state
    const [isLogging, setIsLogging] = useState(false);
    const [logItems, setLogItems] = useState<ServiceItem[]>([{ name: "", price: 0 }]);
    const [logOdo, setLogOdo] = useState<string>("");
    const [logNotes, setLogNotes] = useState("");
    const [odoDecreaseReason, setOdoDecreaseReason] = useState("");
    const [requireOdoReason, setRequireOdoReason] = useState(false);
    const [logPhotos, setLogPhotos] = useState<string[]>([]);

    // Edit Bill state
    const [editingBillId, setEditingBillId] = useState<string | null>(null);
    const [editBillData, setEditBillData] = useState<{ amount: number; date: string; items: ServiceItem[]; odometer?: number }>({ amount: 0, date: "", items: [] });

    // Edit Part state
    const [editingPartId, setEditingPartId] = useState<string | null>(null);
    const [editPartData, setEditPartData] = useState<{ name: string, lifespanOdo: number, lastServiceOdo: number, lifespanMonths?: number, lastServiceDate?: string }>({ name: "", lifespanOdo: 0, lastServiceOdo: 0, lifespanMonths: undefined, lastServiceDate: undefined });

    // Expandable History state
    const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

    // History Pagination state
    const [historyPage, setHistoryPage] = useState(1);
    const PAGE_SIZE = 10;

    if (loading) return null;

    const vehicleId = params.id as string;
    const vehicle = vehicles.find(v => v.id === vehicleId);

    if (!vehicle) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <AlertTriangle size={48} className="text-alert" />
                <h2 className="text-2xl font-bold">Vehicle Not Found</h2>
                <Button variant="ghost" onClick={() => router.push("/owner")}>Return to Dashboard</Button>
            </div>
        );
    }

    // Security check: Only owner should see their vehicle (Mocked)
    if (vehicle.ownerId !== user?.id) {
        return <div className="p-8 text-center text-alert">Unauthorized Access</div>;
    }

    const vehicleParts = parts.filter(p => p.vehicleId === vehicle.id);
    const vehicleBills = bills
        .filter(b => b.vehicleId === vehicle.id && b.status === 'approved')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const pendingBills = bills.filter(b => b.vehicleId === vehicle.id && b.status === 'pending');

    const totalPages = Math.ceil(vehicleBills.length / PAGE_SIZE);
    const paginatedBills = vehicleBills.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

    const needsMaintenance = vehicleParts.some(p => {
        const used = vehicle.currentOdo - p.lastServiceOdo;
        const odoDue = p.lifespanOdo > 0 && (used / p.lifespanOdo) >= 0.9;
        let timeDue = false;
        if (p.lifespanMonths && p.lastServiceDate) {
            const lastDate = new Date(p.lastServiceDate);
            const now = new Date();
            const monthsElapsed = (now.getFullYear() - lastDate.getFullYear()) * 12 + now.getMonth() - lastDate.getMonth();
            timeDue = (monthsElapsed / p.lifespanMonths) >= 0.9;
        }
        return odoDue || timeDue;
    });

    const handleUpdateOdo = async () => {
        const val = parseInt(newOdoValue, 10);
        if (!isNaN(val)) {
            if (val < vehicle.currentOdo) {
                if (!mainOdoDecreaseReason.trim()) {
                    setRequireMainOdoReason(true);
                    return;
                }
            }
            try {
                if (val < vehicle.currentOdo && mainOdoDecreaseReason.trim()) {
                    // Create a dummy record to document why the odometer was reduced
                    await addManualRecord({
                        vehicleId: vehicle.id,
                        plate: vehicle.plate,
                        amount: 0,
                        odometer: val,
                        items: [],
                        notes: `Odometer Adjustment Reason: ${mainOdoDecreaseReason.trim()}`
                    });
                }

                await updateOdometer(vehicle.id, val);
                setUpdatingOdo(false);
                setNewOdoValue("");
                setMainOdoDecreaseReason("");
                setRequireMainOdoReason(false);
            } catch (err: any) {
                console.error("Caught Exception updating odometer:", err);
                alert(`Failed to update odometer: ${err.message || "Unknown error"}`);
            }
        }
    };

    const handleUpdateDates = async () => {
        try {
            await updateVehicleDates(vehicle.id, revDate, insDate, emiDate);
            setEditingDates(false);
        } catch (err: any) {
            console.error("Caught Exception updating dates:", err);
            alert(`Failed to update dates: ${err.message || "Unknown error"}`);
        }
    };

    const handleVehiclePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    await updateVehiclePhoto(vehicle.id, reader.result as string);
                } catch (err: any) {
                    alert(`Failed to update photo: ${err.message}`);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleDeleteVehicle = async () => {
        try {
            await deleteVehicle(vehicle.id);
            router.push("/owner");
        } catch (err: any) {
            alert(`Failed to delete vehicle: ${err.message}`);
            setIsDeletingVehicle(false);
        }
    };

    const handleTransferVehicle = async () => {
        if (!transferEmail.trim()) return;
        try {
            await transferVehicle(vehicle.id, transferEmail);
            alert("Vehicle transferred successfully!");
            router.push("/owner");
        } catch (err: any) {
            alert(`Transfer failed: ${err.message}`);
        }
    };

    // Manual Logging Handlers
    const addLogItem = () => setLogItems([...logItems, { name: "", price: 0 }]);
    const removeLogItem = (idx: number) => setLogItems(logItems.filter((_, i) => i !== idx));

    const updateLogItem = (idx: number, field: keyof ServiceItem, val: string | number | undefined) => {
        const newItems = [...logItems];
        newItems[idx] = { ...newItems[idx], [field]: val };
        setLogItems(newItems);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newPhotos: string[] = [];
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    newPhotos.push(reader.result as string);
                    if (newPhotos.length === e.target.files?.length) {
                        setLogPhotos(prev => [...prev, ...newPhotos]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleSaveLog = async (e: React.FormEvent) => {
        e.preventDefault();
        const validItems = logItems.filter(i => i.name.trim() !== "");
        if (validItems.length === 0) return;

        const parsedOdo = logOdo ? parseInt(logOdo, 10) : undefined;

        // Odometer Decrease Validation
        if (parsedOdo !== undefined && parsedOdo < vehicle.currentOdo) {
            if (!odoDecreaseReason.trim()) {
                setRequireOdoReason(true);
                return; // Stop submission
            }
        }

        try {
            await addManualRecord({
                vehicleId: vehicle.id,
                plate: vehicle.plate,
                amount: validItems.reduce((acc, item) => acc + (item.price || 0), 0),
                odometer: parsedOdo,
                items: validItems,
                notes: odoDecreaseReason.trim() ? `Odometer Adjustment Reason: ${odoDecreaseReason.trim()}${logNotes ? ' | ' + logNotes : ''}` : logNotes,
                photos: logPhotos.length > 0 ? logPhotos : undefined
            });

            if (parsedOdo !== undefined && (parsedOdo > vehicle.currentOdo || (parsedOdo < vehicle.currentOdo && odoDecreaseReason.trim()))) {
                await updateOdometer(vehicle.id, parsedOdo);
            }

            setIsLogging(false);
            setLogItems([{ name: "", price: 0 }]);
            setLogOdo("");
            setOdoDecreaseReason("");
            setRequireOdoReason(false);
            setLogPhotos([]);
        } catch (err: any) {
            console.error("Caught Exception saving manual log:", err);
            alert(`Failed to save manual log: ${err.message || "Unknown error"}`);
        }
    };

    // Edit Bill Handlers
    const startEditBill = (bill: Bill) => {
        setEditingBillId(bill.id);
        const isoDate = new Date(bill.date).toISOString().split('T')[0];
        setEditBillData({
            amount: bill.amount,
            date: isoDate,
            items: JSON.parse(JSON.stringify(bill.items || [])), // deep copy
            odometer: bill.odometer
        });
    };

    const saveEditBill = async () => {
        if (editingBillId) {
            try {
                await updateBill(editingBillId, {
                    amount: editBillData.amount,
                    date: new Date(editBillData.date).toISOString(),
                    items: editBillData.items,
                    odometer: editBillData.odometer
                });
                setEditingBillId(null);
            } catch (err: any) {
                console.error("Caught Exception saving edited bill:", err);
                alert(`Failed to save bill edits: ${err.message || "Unknown error"}`);
            }
        }
    };

    const handleSaveEditPart = async (partId: string) => {
        try {
            await updatePart(partId, editPartData);
            setEditingPartId(null);
        } catch (err: any) {
            console.error("Caught Exception updating part:", err);
            alert(`Failed to update part: ${err.message || "Unknown error"}`);
        }
    };

    const handleDeletePartAction = async (partId: string) => {
        try {
            await deletePart(partId);
            setEditingPartId(null);
        } catch (err: any) {
            console.error("Caught Exception deleting part:", err);
            alert(`Failed to delete part: ${err.message || "Unknown error"}`);
        }
    };

    const updateEditBillItem = (idx: number, field: keyof ServiceItem, val: string | number | undefined) => {
        const newItems = [...editBillData.items];
        newItems[idx] = { ...newItems[idx], [field]: val };

        // Auto-recalculate total amount based on items
        const newTotal = newItems.reduce((acc, item) => acc + (item.price || 0), 0);

        setEditBillData({ ...editBillData, items: newItems, amount: newTotal });
    };

    const openLightbox = (images: string[], index: number = 0) => {
        setLightboxImages(images);
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    return (
        <div className="space-y-6">
            <Lightbox
                isOpen={lightboxOpen}
                images={lightboxImages}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
            />

            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div className="flex items-start md:items-center gap-4 sm:gap-6">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/owner")} className="shrink-0 rounded-full hover:bg-panel border-transparent hover:border-panel-border transition-all mt-2 md:mt-0">
                        <ArrowLeft size={24} />
                    </Button>
                    {/* Vehicle Photo / Avatar */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-panel border-2 border-panel-border shrink-0 relative group">
                        {vehicle.photo ? (
                            <img src={vehicle.photo} alt={vehicle.model} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-foreground/30">
                                <FileText size={40} />
                            </div>
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                            <span className="text-xs font-bold text-white">Edit Photo</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleVehiclePhotoChange} />
                        </label>
                    </div>

                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{vehicle.make} {vehicle.model}</h1>
                            {needsMaintenance && (
                                <span className="bg-warning/20 text-warning text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 border border-warning/30 hidden sm:flex">
                                    <AlertTriangle size={12} /> Service Advised
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-foreground/50">
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary/70"></span> {vehicle.year}</span>
                            <span className="flex items-center gap-2 font-mono uppercase tracking-widest"><span className="w-2 h-2 rounded-full bg-foreground/30"></span> {vehicle.plate}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {isTransferring ? (
                        <div className="flex gap-2 w-full md:w-auto p-2 bg-primary/10 border border-primary/30 rounded-lg animate-in fade-in slide-in-from-right-4">
                            <Input
                                type="email"
                                placeholder="New Owner's Email"
                                value={transferEmail}
                                onChange={(e: any) => setTransferEmail(e.target.value)}
                                className="h-8 text-sm"
                            />
                            <Button variant="primary" className="h-8 text-xs px-3" onClick={handleTransferVehicle}>Transfer</Button>
                            <Button variant="ghost" className="h-8 text-xs px-2" onClick={() => { setIsTransferring(false); setTransferEmail(""); }}>Cancel</Button>
                        </div>
                    ) : isDeletingVehicle ? (
                        <div className="flex gap-2 w-full md:w-auto p-2 bg-alert/10 border border-alert/30 rounded-lg animate-in fade-in slide-in-from-right-4">
                            <p className="text-xs text-alert font-bold flex items-center px-2">Are you sure?</p>
                            <Button variant="ghost" className="h-8 text-xs px-2" onClick={() => setIsDeletingVehicle(false)}>Cancel</Button>
                            <Button variant="primary" className="h-8 text-xs px-3 bg-alert/80 hover:bg-alert text-white" onClick={handleDeleteVehicle}>Delete</Button>
                        </div>
                    ) : (
                        <>
                            <Button variant="ghost" className="border border-primary/20 text-primary hover:bg-primary/10 flex-1 md:flex-none" onClick={() => setIsTransferring(true)}>
                                Transfer Ownership
                            </Button>
                            <Button variant="ghost" className="border border-alert/20 text-alert hover:bg-alert/10 flex-1 md:flex-none" onClick={() => setIsDeletingVehicle(true)}>
                                <Trash2 size={16} className="mr-2" /> Delete Vehicle
                            </Button>
                        </>
                    )}
                    <Button variant="ghost" className="border border-primary text-primary hover:bg-primary/20 flex-1 md:flex-none" onClick={() => setIsLogging(!isLogging)}>
                        Maintenance Log
                    </Button>
                </div>
            </div>

            {pendingBills.length > 0 && (
                <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-lg mb-6 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-warning mb-1">Pending Actions</h4>
                        <p className="text-sm text-foreground/70">You have {pendingBills.length} pending service invoice(s) waiting for approval on your dashboard.</p>
                    </div>
                    <Button variant="ghost" className="text-warning border border-warning/30" onClick={() => router.push("/owner")}>View in Dashboard</Button>
                </div>
            )}

            {isLogging && (
                <Card className="border-primary/50 animate-in slide-in-from-top-4 fade-in">
                    <CardHeader>
                        <CardTitle>Log Manual Service / Modification</CardTitle>
                        <CardDescription>Did it yourself? Log it here to update part health tracking.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSaveLog} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Items Performed</label>
                                <div className="space-y-3">
                                    {logItems.map((item, i) => (
                                        <div key={i} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-background p-4 rounded-lg border border-panel-border">
                                            <div className="w-full sm:flex-1">
                                                <label className="block sm:hidden text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">Item Name</label>
                                                <Input
                                                    required
                                                    list="common-parts"
                                                    placeholder="Part/Service (Ex: Replaced Tires)"
                                                    value={item.name}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLogItem(i, 'name', e.target.value)}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="flex w-full sm:w-auto gap-2">
                                                <div className="flex-1 sm:flex-none">
                                                    <label className="block sm:hidden text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">Lifespan (km)</label>
                                                    <Input
                                                        type="number"
                                                        placeholder="Life(km)"
                                                        value={item.lifespanOdo || ""}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLogItem(i, 'lifespanOdo', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                                        className="w-full sm:w-28 font-mono text-sm"
                                                    />
                                                </div>
                                                <div className="flex-1 sm:flex-none">
                                                    <label className="block sm:hidden text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">Lifespan (mos)</label>
                                                    <Input
                                                        type="number"
                                                        placeholder="Life(mo)"
                                                        value={item.lifespanMonths || ""}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLogItem(i, 'lifespanMonths', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                                        className="w-full sm:w-28 font-mono text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-panel-border sm:border-t-0">
                                                <span className="text-foreground/50 text-sm font-bold">Rs</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={item.price || ""}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLogItem(i, 'price', e.target.value ? parseFloat(e.target.value) : 0)}
                                                    className="flex-1 sm:w-28 font-mono"
                                                />
                                                <Button type="button" variant="ghost" className="text-alert px-2 ml-1" onClick={() => removeLogItem(i)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="ghost" className="text-sm" onClick={addLogItem}>
                                        <Plus size={16} className="mr-2" /> Add Line Item
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-panel-border mb-4">
                                <label className="block text-sm font-medium mb-2">Service Odometer (Optional)</label>
                                <Input
                                    type="number"
                                    placeholder={`Odometer at time of service (Default: ${vehicle.currentOdo.toLocaleString()})`}
                                    value={logOdo}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        setLogOdo(e.target.value);
                                        const val = parseInt(e.target.value, 10);
                                        if (val >= vehicle.currentOdo) {
                                            setRequireOdoReason(false);
                                        }
                                    }}
                                    className="font-mono bg-background w-full"
                                />
                                {requireOdoReason && (
                                    <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded-lg animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-start gap-2 text-warning mb-2">
                                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                                            <div className="text-sm">
                                                <strong>Warning: Odometer Decrease Detected.</strong>
                                                <p className="opacity-80">The logged odometer ({logOdo}) is less than the vehicle's current master odometer ({vehicle.currentOdo.toLocaleString()}). Please provide a reason (e.g., "Replacing bad cluster", "Fixing typo").</p>
                                            </div>
                                        </div>
                                        <Input
                                            required
                                            value={odoDecreaseReason}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOdoDecreaseReason(e.target.value)}
                                            placeholder="Reason for changing odometer backwards..."
                                            className="bg-background border-warning/50 focus-visible:ring-warning"
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-panel-border mb-4">
                                <label className="block text-sm font-medium mb-2">Service Notes (Optional)</label>
                                <Input
                                    placeholder="Any additional details about this service..."
                                    value={logNotes}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogNotes(e.target.value)}
                                    className="bg-background w-full"
                                />
                            </div>

                            <div className="pt-4 border-t border-panel-border mb-4">
                                <label className="block text-sm font-medium mb-2">Evidence / Receipts (Optional)</label>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-3">
                                        {logPhotos.map((photo, idx) => (
                                            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-panel-border bg-black/50 group">
                                                <img src={photo} alt="Upload preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setLogPhotos(logPhotos.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="w-24 h-24 rounded-lg border-2 border-dashed border-panel-border flex flex-col items-center justify-center text-foreground/40 hover:text-primary hover:border-primary/50 cursor-pointer transition-colors bg-panel/30">
                                            <Camera size={24} className="mb-2" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Add Photo</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={handlePhotoUpload}
                                            />
                                        </label>
                                    </div>
                                    <p className="text-xs text-foreground/40 italic">Upload photos of parts replaced, odometer reading, or paper receipts.</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-panel-border">
                                <Button type="button" variant="ghost" onClick={() => { setIsLogging(false); setRequireOdoReason(false); setLogPhotos([]); }}>Cancel</Button>
                                <Button type="submit" variant="primary">Save Record</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats & Health */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Odometer Card */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm text-foreground/50 uppercase tracking-widest font-semibold flex items-center gap-2">
                                <History size={16} /> Current Odometer
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-mono font-bold text-primary mb-6">
                                {vehicle.currentOdo.toLocaleString()} <span className="text-sm font-sans font-normal text-foreground/50">km</span>
                            </div>

                            {updatingOdo ? (
                                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                    <Input
                                        type="number"
                                        placeholder="Enter new mileage"
                                        value={newOdoValue}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            setNewOdoValue(e.target.value);
                                            const val = parseInt(e.target.value, 10);
                                            if (val >= vehicle.currentOdo) {
                                                setRequireMainOdoReason(false);
                                            }
                                        }}
                                        className="font-mono text-lg py-6"
                                        autoFocus
                                    />
                                    {requireMainOdoReason && (
                                        <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2 font-bold mb-2">
                                                <AlertTriangle size={16} /> Decrease Detected
                                            </div>
                                            <p className="opacity-80 mb-3">Please state why you are reducing the master odometer below.</p>
                                            <Input
                                                required
                                                value={mainOdoDecreaseReason}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMainOdoDecreaseReason(e.target.value)}
                                                placeholder="Reason for decrease..."
                                                className="bg-background border-warning/50 text-foreground"
                                            />
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <Button variant="primary" className="flex-1" onClick={handleUpdateOdo}>Confirm</Button>
                                        <Button variant="ghost" onClick={() => { setUpdatingOdo(false); setRequireMainOdoReason(false); }}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <Button variant="ghost" className="w-full bg-panel-border/30 hover:bg-panel-border/50 text-foreground" onClick={() => setUpdatingOdo(true)}>
                                    Update Mileage
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Part Health Card */}
                    <Card>
                        <CardHeader className="pb-4 border-b border-panel-border mb-4">
                            <CardTitle className="text-sm text-foreground/50 uppercase tracking-widest font-semibold flex items-center gap-2">
                                <Wrench size={16} /> Part Lifespans
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                            }).map(part => {
                                const currentSpan = vehicle.currentOdo - part.lastServiceOdo;
                                let currentMonths = 0;
                                if (part.lifespanMonths && part.lastServiceDate) {
                                    const lastDate = new Date(part.lastServiceDate);
                                    const now = new Date();
                                    currentMonths = (now.getFullYear() - lastDate.getFullYear()) * 12 + now.getMonth() - lastDate.getMonth();
                                }

                                if (editingPartId === part.id) {
                                    return (
                                        <div key={part.id} className="p-4 bg-background border border-panel-border rounded-xl space-y-3 relative z-10">
                                            <Input
                                                value={editPartData.name}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditPartData({ ...editPartData, name: e.target.value })}
                                                placeholder="Part Name"
                                                className="font-bold"
                                            />
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <label className="text-xs text-foreground/50 mb-1 block">Lifespan(km)</label>
                                                    <Input
                                                        type="number"
                                                        value={editPartData.lifespanOdo}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditPartData({ ...editPartData, lifespanOdo: parseInt(e.target.value, 10) || 0 })}
                                                        className="font-mono text-sm"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-xs text-foreground/50 mb-1 block">Lifespan(mo)</label>
                                                    <Input
                                                        type="number"
                                                        value={editPartData.lifespanMonths || ""}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditPartData({ ...editPartData, lifespanMonths: parseInt(e.target.value, 10) || undefined })}
                                                        className="font-mono text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <label className="text-xs text-foreground/50 mb-1 block">Last Service Odo</label>
                                                    <Input
                                                        type="number"
                                                        value={editPartData.lastServiceOdo}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditPartData({ ...editPartData, lastServiceOdo: parseInt(e.target.value, 10) || 0 })}
                                                        className="font-mono text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-panel-border mt-2">
                                                <Button type="button" variant="ghost" className="text-alert px-3 hover:bg-alert/10" onClick={() => handleDeletePartAction(part.id)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                                <div className="flex gap-2">
                                                    <Button type="button" variant="ghost" onClick={() => setEditingPartId(null)}>Cancel</Button>
                                                    <Button
                                                        type="button"
                                                        variant="primary"
                                                        onClick={() => handleSaveEditPart(part.id)}
                                                    >
                                                        Save
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                const odoProgress = part.lifespanOdo > 0 ? (currentSpan / part.lifespanOdo) * 100 : 0;

                                let timeProgress = 0;
                                let monthsElapsed = 0;
                                if (part.lifespanMonths && part.lastServiceDate) {
                                    const lastDate = new Date(part.lastServiceDate);
                                    const now = new Date();
                                    monthsElapsed = (now.getFullYear() - lastDate.getFullYear()) * 12 + now.getMonth() - lastDate.getMonth();
                                    timeProgress = (monthsElapsed / part.lifespanMonths) * 100;
                                }

                                const maxProgress = Math.max(odoProgress, timeProgress);
                                const progressPercent = Math.min(maxProgress, 100);

                                let statusColor = "bg-success text-success-foreground";
                                let borderColor = "border-success/30";
                                if (progressPercent > 85) {
                                    statusColor = "bg-warning text-warning-foreground";
                                    borderColor = "border-warning/50";
                                }
                                if (progressPercent >= 100) {
                                    statusColor = "bg-alert text-white";
                                    borderColor = "border-alert";
                                }

                                return (
                                    <div key={part.id} className={`p-4 bg-background border rounded-xl space-y-3 relative z-10 transition-colors ${borderColor}`}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-lg text-foreground">{part.name}</h4>
                                                {(odoProgress >= 90 || timeProgress >= 90) && (
                                                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-alert/20 text-alert border border-alert/30">
                                                        <AlertTriangle size={10} /> {timeProgress > odoProgress ? 'Time Due' : 'Mileage Due'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2 text-foreground/50">
                                                <button type="button" onClick={() => { setEditingPartId(part.id); setEditPartData({ name: part.name, lastServiceOdo: part.lastServiceOdo, lifespanOdo: part.lifespanOdo, lastServiceDate: part.lastServiceDate || undefined, lifespanMonths: part.lifespanMonths || undefined }); }} className="hover:text-primary transition-colors"><Edit2 size={16} /></button>
                                                <button type="button" onClick={() => deletePart(part.id)} className="hover:text-alert transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </div>

                                        <div className="space-y-1 mt-2">
                                            <div className="h-2 w-full bg-panel rounded-full overflow-hidden border border-panel-border/50">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${statusColor}`} style={{ width: `${progressPercent}%` }} />
                                            </div>
                                            <div className="flex justify-between text-[11px] font-mono font-medium text-foreground/50 mt-1">
                                                <span>{currentSpan.toLocaleString()}km used</span>
                                                <span>{part.lifespanOdo.toLocaleString()}km limit</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] font-mono font-medium text-foreground/50">
                                                {part.lifespanMonths && part.lastServiceDate ? (
                                                    <><span>{monthsElapsed}mo elapsed</span><span>{part.lifespanMonths}mo limit</span></>
                                                ) : (
                                                    <span className="opacity-0">.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {
                                vehicleParts.length === 0 && (
                                    <div className="text-center py-6 text-foreground/40 italic">
                                        No part lifespans are currently being tracked for this vehicle.
                                    </div>
                                )
                            }
                        </CardContent>
                    </Card>

                    {/* Vehicle Registration & Insurance Card */}
                    <Card>
                        <CardHeader className="pb-4 border-b border-panel-border mb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm text-foreground/50 uppercase tracking-widest font-semibold flex items-center gap-2">
                                <FileText size={16} /> Legal & Docs
                            </CardTitle>
                            {!editingDates && <Button variant="ghost" size="icon" onClick={() => {
                                setRevDate(vehicle.revenueLicenseDate || "");
                                setInsDate(vehicle.insuranceDate || "");
                                setEmiDate(vehicle.emissionReportDate || "");
                                setEditingDates(true);
                            }}><Edit2 size={14} /></Button>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {editingDates ? (
                                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                    <div>
                                        <label className="block text-xs text-foreground/50 mb-1">Revenue License Date</label>
                                        <Input type="date" value={revDate} onChange={(e: any) => setRevDate(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-foreground/50 mb-1">Insurance Renewal Date</label>
                                        <Input type="date" value={insDate} onChange={(e: any) => setInsDate(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-foreground/50 mb-1">Emission Report Date</label>
                                        <Input type="date" value={emiDate} onChange={(e: any) => setEmiDate(e.target.value)} />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="primary" className="flex-1 text-sm h-8 py-0" onClick={handleUpdateDates}>Save</Button>
                                        <Button variant="ghost" className="h-8 text-sm py-0" onClick={() => setEditingDates(false)}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-panel-border pb-3">
                                        <span className="text-sm text-foreground/70">Rev. License</span>
                                        <span className={!vehicle.revenueLicenseDate ? "text-warning text-sm font-bold" : "text-sm text-foreground font-mono"}>
                                            {vehicle.revenueLicenseDate ? new Date(vehicle.revenueLicenseDate).toLocaleDateString() : "Not Set"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3">
                                        <span className="text-sm text-foreground/70">Insurance</span>
                                        <span className={!vehicle.insuranceDate ? "text-warning text-sm font-bold" : "text-sm text-foreground font-mono"}>
                                            {vehicle.insuranceDate ? new Date(vehicle.insuranceDate).toLocaleDateString() : "Not Set"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-panel-border pt-3">
                                        <span className="text-sm text-foreground/70">Emission Report</span>
                                        <span className={!vehicle.emissionReportDate ? "text-warning text-sm font-bold" : "text-sm text-foreground font-mono"}>
                                            {vehicle.emissionReportDate ? new Date(vehicle.emissionReportDate).toLocaleDateString() : "Not Set"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Service History log */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader className="border-b border-panel-border pb-6">
                            <CardTitle>Digital Service History</CardTitle>
                            <CardDescription>Verified maintenance records and parts swapped.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="relative border-l-2 border-panel-border ml-4 space-y-10 pb-8">
                                {paginatedBills.map((bill, index) => {
                                    const isOdoChange = bill.amount === 0 && (!bill.items || bill.items.length === 0);

                                    // Odometer calculation
                                    const globalIndex = (historyPage - 1) * PAGE_SIZE + index;
                                    const nextBillWithOdo = vehicleBills.slice(globalIndex + 1).find(b => b.odometer !== undefined && b.odometer !== null);
                                    const prevOdo = nextBillWithOdo ? nextBillWithOdo.odometer : undefined;

                                    let colorClass = "text-primary/80 bg-primary/10 border-primary/20";
                                    let icon = null;

                                    if (prevOdo !== undefined && bill.odometer !== undefined && bill.odometer !== null) {
                                        if (bill.odometer > prevOdo) {
                                            colorClass = "text-success bg-success/10 border-success/30";
                                            icon = <span className="text-[10px]">▲</span>;
                                        } else if (bill.odometer < prevOdo) {
                                            colorClass = "text-alert bg-alert/10 border-alert/30";
                                            icon = <span className="text-[10px]">▼</span>;
                                        }
                                    }

                                    return (
                                        <div key={bill.id} className="relative pl-8">
                                            {/* Timeline Dot */}
                                            <div className="absolute w-4 h-4 bg-primary rounded-full -left-[9px] top-1 outline outline-4 outline-panel shadow-[0_0_10px_rgba(0,119,182,0.5)]"></div>

                                            <div className="bg-background border border-panel-border p-5 rounded-xl hover:border-primary/50 transition-colors group relative">
                                                {editingBillId !== bill.id && (
                                                    <Button size="icon" variant="ghost" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startEditBill(bill)}>
                                                        <Edit2 size={16} className="text-foreground/50 hover:text-foreground" />
                                                    </Button>
                                                )}

                                                {editingBillId === bill.id ? (
                                                    <div className="mb-4 space-y-4 bg-panel p-5 rounded-lg animate-in fade-in border border-panel-border">
                                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-panel-border">
                                                            <h4 className="font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-2">
                                                                <Edit2 size={14} /> Full Record Editor
                                                            </h4>
                                                            <Button size="icon" variant="ghost" onClick={() => setEditingBillId(null)}>
                                                                <X size={16} />
                                                            </Button>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                            <div>
                                                                <label className="block text-xs font-bold text-foreground/50 mb-1 uppercase">Date</label>
                                                                <Input type="date" value={editBillData.date} onChange={(e: any) => setEditBillData({ ...editBillData, date: e.target.value })} className="font-mono text-sm bg-background border-foreground/20" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-foreground/50 mb-1 uppercase">Odometer</label>
                                                                <Input type="number" placeholder="Mileage at service" value={editBillData.odometer || ""} onChange={(e: any) => setEditBillData({ ...editBillData, odometer: e.target.value ? parseInt(e.target.value, 10) : undefined })} className="font-mono text-sm bg-background border-foreground/20" />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-bold text-foreground/50 mb-2 uppercase">Line Items</label>
                                                            <div className="space-y-2">
                                                                {editBillData.items.map((item, idx) => (
                                                                    <div key={idx} className="flex gap-2 items-center bg-background p-2 rounded border border-panel-border">
                                                                        <Input
                                                                            value={item.name}
                                                                            onChange={(e: any) => updateEditBillItem(idx, 'name', e.target.value)}
                                                                            placeholder="Item Name"
                                                                            className="flex-1 h-8 text-sm"
                                                                        />
                                                                        <Input
                                                                            type="number"
                                                                            value={item.lifespanOdo || ""}
                                                                            onChange={(e: any) => updateEditBillItem(idx, 'lifespanOdo', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                                                            placeholder="+Lifespan(km)"
                                                                            className="w-20 h-8 text-sm font-mono"
                                                                        />
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-foreground/50 text-sm">Rs</span>
                                                                            <Input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={item.price || ""}
                                                                                onChange={(e: any) => updateEditBillItem(idx, 'price', e.target.value ? parseFloat(e.target.value) : 0)}
                                                                                className="w-32 h-8 text-sm font-mono"
                                                                            />
                                                                        </div>
                                                                        <Button type="button" variant="ghost" className="h-8 w-8 p-0 text-alert shrink-0" onClick={() => {
                                                                            const newItems = editBillData.items.filter((_, i) => i !== idx);
                                                                            setEditBillData({ ...editBillData, items: newItems, amount: newItems.reduce((acc, it) => acc + (it.price || 0), 0) });
                                                                        }}>
                                                                            <Trash2 size={14} />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                                <Button type="button" variant="ghost" size="sm" className="w-full text-xs h-8 border border-dashed border-panel-border" onClick={() => {
                                                                    setEditBillData({ ...editBillData, items: [...editBillData.items, { name: "", price: 0 }] });
                                                                }}>
                                                                    <Plus size={14} className="mr-1" /> Add Line Item
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-panel-border">
                                                            <span className="text-sm font-bold text-foreground/50 uppercase tracking-wider">Total</span>
                                                            <div className="font-mono font-bold text-lg text-primary">Rs {editBillData.amount.toFixed(2)}</div>
                                                        </div>

                                                        <Button variant="primary" className="w-full mt-4" onClick={saveEditBill}><Save size={16} className="mr-2" /> Save & Update Record</Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-start mb-4 pr-8">
                                                        <div>
                                                            <h4 className="font-bold text-lg text-foreground">
                                                                {isOdoChange ? 'Odometer Adjustment' : (bill.source === 'garage' ? 'Garage Service' : 'DIY Maintenance')}
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
                                                        <div className="text-right">
                                                            <span className="font-mono text-xl font-bold text-foreground/80">Rs {bill.amount.toFixed(2)}</span>
                                                            {bill.source === 'garage' && (
                                                                <div className="flex items-center gap-1 text-xs text-success mt-1 justify-end font-medium">
                                                                    <CheckCircle size={12} /> Garage Verified
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {!(bill.amount === 0 && (!bill.items || bill.items.length === 0)) ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="w-full flex items-center justify-between p-2 mt-2 bg-panel/50 hover:bg-panel border border-panel-border/50 rounded-lg text-xs font-bold text-foreground/60 transition-colors"
                                                            onClick={() => setExpandedBillId(expandedBillId === bill.id ? null : bill.id)}
                                                        >
                                                            <span>{expandedBillId === bill.id ? "Hide Details" : "View Invoice Details"}</span>
                                                        </button>

                                                        {expandedBillId === bill.id && (
                                                            <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                                {bill.notes && (
                                                                    <div className="bg-panel/30 rounded-lg p-3 text-sm border border-panel-border/30">
                                                                        <p className="text-foreground/50 text-xs uppercase font-bold mb-1 tracking-wider">Notes</p>
                                                                        <p className="text-foreground/80">{bill.notes}</p>
                                                                    </div>
                                                                )}

                                                                <div className="bg-panel rounded-lg p-2 border border-panel-border/50">
                                                                    <h5 className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-1.5 px-1">Line Items</h5>
                                                                    <ul className="space-y-1">
                                                                        {bill.items?.map((item, idx) => (
                                                                            <li key={idx} className="flex justify-between text-xs items-center px-1 hover:bg-background/50 rounded py-0.5 transition-colors">
                                                                                <span className="text-foreground/80">• {item.name}</span>
                                                                                <div className="text-right flex items-center gap-2">
                                                                                    {item.lifespanOdo && <span className="text-[10px] text-foreground/40 border border-panel-border px-1.5 py-0 rounded bg-background">+{item.lifespanOdo / 1000}k km</span>}
                                                                                    <span className="font-mono text-primary font-bold">Rs {item.price.toFixed(2)}</span>
                                                                                </div>
                                                                            </li>
                                                                        ))}
                                                                        {!bill.items && (
                                                                            <li className="flex justify-between text-xs italic text-foreground/50 px-1">
                                                                                Legacy record
                                                                            </li>
                                                                        )}
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    bill.notes && (
                                                        <div className="mt-2 bg-panel/30 rounded-lg p-3 text-sm border border-panel-border/30">
                                                            <p className="text-foreground/50 text-xs uppercase font-bold mb-1 tracking-wider">Reason</p>
                                                            <p className="text-foreground/80 italic">{bill.notes}</p>
                                                        </div>
                                                    )
                                                )}

                                                {bill.photos && bill.photos.length > 0 && (
                                                    <div>
                                                        <h5 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-2">Evidence</h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {bill.photos?.map((photo, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => openLightbox(bill.photos || [], idx)}
                                                                    className="w-20 h-20 rounded-lg overflow-hidden border border-panel-border hover:border-primary transition-all cursor-zoom-in"
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

                                {vehicleBills.length === 0 && (
                                    <div className="pl-8 text-foreground/40 italic pt-4">
                                        No approved service history records found.
                                    </div>
                                )}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center mt-6 pt-4 border-t border-panel-border">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                        disabled={historyPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm text-foreground/50 font-mono">
                                        Page {historyPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                                        disabled={historyPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <datalist id="common-parts">
                {/* Regular Maintenance */}
                <option value="Engine Oil" />
                <option value="Oil Filter" />
                <option value="Air Filter" />
                <option value="Cabin Air Filter" />
                <option value="Spark Plugs" />
                <option value="Fuel Filter" />
                <option value="Transmission Fluid" />
                <option value="Coolant Flush" />
                <option value="Brake Fluid" />
                <option value="Power Steering Fluid" />

                {/* Wear & Tear Parts */}
                <option value="Tires" />
                <option value="Front Brake Pads" />
                <option value="Rear Brake Pads" />
                <option value="Brake Rotors" />
                <option value="Battery" />
                <option value="Wiper Blades" />
                <option value="Timing Belt" />
                <option value="Serpentine Belt" />
                <option value="Water Pump" />
                <option value="Alternator" />
                <option value="Starter Motor" />

                {/* Suspension & Steering */}
                <option value="Shock Absorbers" />
                <option value="Struts" />
                <option value="Wheel Alignment" />
                <option value="Tie Rod Ends" />
                <option value="Ball Joints" />
                <option value="Wheel Bearings" />

                {/* Motorcycle & Scooter Specific */}
                <option value="CVT Belt" />
                <option value="Drive Chain" />
                <option value="Sprockets" />
                <option value="Clutch Plates" />
                <option value="Fork Seals" />
                <option value="Fork Oil" />
                <option value="Valve Clearance Check" />
                <option value="Carburetor Clean" />
                <option value="Gearbox Oil" />

                {/* Common Services */}
                <option value="AC Recharge" />
                <option value="Diagnostic Fee" />
                <option value="State Inspection" />
                <option value="Emissions Test" />
                <option value="Detailing" />
            </datalist>
        </div>
    );
}
