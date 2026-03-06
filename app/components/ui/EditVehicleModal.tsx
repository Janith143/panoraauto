import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { X, Loader2 } from "lucide-react";
import { useVehicles } from "@/app/context/VehicleContext";

interface EditVehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicleId: string;
}

export function EditVehicleModal({ isOpen, onClose, vehicleId }: EditVehicleModalProps) {
    const { vehicles, updateVehicle } = useVehicles();
    const vehicle = vehicles.find(v => v.id === vehicleId);

    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [year, setYear] = useState("");
    const [plate, setPlate] = useState("");
    const [engineType, setEngineType] = useState("");
    const [vin, setVin] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && vehicle) {
            setMake(vehicle.make);
            setModel(vehicle.model);
            setYear(vehicle.year.toString());
            setPlate(vehicle.plate);
            setEngineType(vehicle.engineType || "");
            setVin(vehicle.vin || "");
            setError(null);
        }
    }, [isOpen, vehicle]);

    if (!isOpen || !vehicle) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSaving(true);

        const parsedYear = parseInt(year, 10);
        if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > new Date().getFullYear() + 1) {
            setError("Please enter a valid year.");
            setIsSaving(false);
            return;
        }

        try {
            await updateVehicle(vehicle.id, {
                make: make.trim(),
                model: model.trim(),
                year: parsedYear,
                plate: plate.trim().replace(/\s+/g, '-').toUpperCase(),
                engineType: engineType.trim() || null,
                vin: vin.trim() || undefined
            });
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to update vehicle.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-panel border border-panel-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-panel-border bg-panel/50">
                    <h2 className="text-xl font-bold">Edit Vehicle Details</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/5">
                        <X size={20} />
                    </Button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-alert/10 border border-alert/30 text-alert text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <form id="edit-vehicle-form" onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">Make</label>
                            <Input
                                required
                                value={make}
                                onChange={e => setMake(e.target.value)}
                                placeholder="e.g. Toyota"
                                className="bg-background"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">Model</label>
                            <Input
                                required
                                value={model}
                                onChange={e => setModel(e.target.value)}
                                placeholder="e.g. Corolla"
                                className="bg-background"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">Year</label>
                                <Input
                                    required
                                    type="number"
                                    value={year}
                                    onChange={e => setYear(e.target.value)}
                                    placeholder="2015"
                                    className="bg-background"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">Engine/Transmission</label>
                                <Input
                                    value={engineType}
                                    onChange={e => setEngineType(e.target.value)}
                                    placeholder="1.8L Auto"
                                    className="bg-background"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">License Plate</label>
                            <Input
                                required
                                value={plate}
                                onChange={e => setPlate(e.target.value)}
                                placeholder="CBA-1234"
                                className="bg-background uppercase"
                            />
                            <p className="text-[10px] text-foreground/40 mt-1">If you change a plate already known to garages, they will need to search for the new plate.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">VIN / Chassis Number (Optional)</label>
                            <Input
                                value={vin}
                                onChange={e => setVin(e.target.value)}
                                placeholder="e.g. JTD123456789"
                                className="bg-background uppercase"
                            />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-panel-border bg-panel/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button type="submit" form="edit-vehicle-form" variant="primary" disabled={isSaving}>
                        {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
