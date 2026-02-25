"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";

export interface Part {
    id: string;
    vehicleId: string;
    name: string;
    lastServiceOdo: number;
    lifespanOdo: number;
    lastServiceDate?: string;
    lifespanMonths?: number;
}

export interface Vehicle {
    id: string;
    ownerId: string;
    make: string;
    model: string;
    year: number;
    plate: string;
    currentOdo: number;
    revenueLicenseDate?: string;
    insuranceDate?: string;
    emissionReportDate?: string;
    photo?: string;
}

export interface GarageCustomer {
    id: string;
    garageId: string;
    make: string;
    model: string;
    year: number;
    plate: string;
    phone?: string;
    ownerName?: string;
    notes?: string;
    odometer?: number;
}

export interface ServiceItem {
    name: string;
    price: number;
    qty?: number;
    lifespanOdo?: number;
    lifespanMonths?: number;
}

export interface Bill {
    id: string;
    vehicleId?: string; // Optional if no registered owner matches
    garageCustomerId?: string; // To link specifically to the Garage DB
    plate?: string;
    garageId?: string;
    items: ServiceItem[];
    amount: number;
    discount?: number;
    odometer?: number;
    notes?: string;
    status: "pending" | "approved";
    source: "garage" | "owner";
    date: string;
    photos?: string[];
}

interface VehicleContextType {
    vehicles: Vehicle[];
    parts: Part[];
    bills: Bill[];
    garageCustomers: GarageCustomer[];
    updateOdometer: (vehicleId: string, newOdo: number) => Promise<void>;
    updateVehicleDates: (vehicleId: string, revenueDate: string, insuranceDate: string, emissionReportDate: string) => Promise<void>;
    updateVehiclePhoto: (vehicleId: string, photoDataUrl: string) => Promise<void>;
    addVehicle: (vehicle: Omit<Vehicle, 'id' | 'ownerId'>) => Promise<Vehicle>;
    deleteVehicle: (vehicleId: string) => Promise<void>;
    transferVehicle: (vehicleId: string, newOwnerEmail: string) => Promise<void>;
    addGarageCustomer: (customer: Omit<GarageCustomer, 'id' | 'garageId'>, garageId?: string) => Promise<GarageCustomer>;
    updateGarageCustomer: (id: string, updates: Partial<GarageCustomer>) => Promise<void>;
    sendBill: (bill: Omit<Bill, 'id' | 'status' | 'date' | 'source' | 'vehicleId'>) => Promise<void>;
    updateBill: (billId: string, updatedData: Partial<Bill>) => Promise<void>;
    addManualRecord: (record: Omit<Bill, 'id' | 'status' | 'date' | 'source'>) => Promise<void>;
    approveBill: (billId: string, notes?: string, odometer?: number, items?: ServiceItem[], amount?: number) => Promise<void>;
    updatePart: (partId: string, updatedData: Partial<Part>) => Promise<void>;
    deletePart: (partId: string) => Promise<void>;
    loading: boolean;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [parts, setParts] = useState<Part[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [garageCustomers, setGarageCustomers] = useState<GarageCustomer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                if (!user?.id) {
                    setVehicles([]);
                    setParts([]);
                    setBills([]);
                    setGarageCustomers([]);
                    setLoading(false);
                    return;
                }

                if (user.role === 'owner') {
                    // 1. Fetch Owner Vehicles
                    const vRes = await fetch(`/api/vehicles?ownerId=${user.id}`);
                    if (vRes.ok) {
                        const dbVehicles = await vRes.json();
                        setVehicles(dbVehicles);
                    } else { setVehicles([]); }

                    // 2. Fetch Parts for those vehicles
                    const pRes = await fetch(`/api/parts?ownerId=${user.id}`);
                    if (pRes.ok) {
                        const dbParts = await pRes.json();
                        setParts(dbParts);
                    } else { setParts([]); }

                    // 3. Fetch Bills/History for those vehicles
                    const hRes = await fetch(`/api/history?userId=${user.id}&role=owner`);
                    if (hRes.ok) {
                        const rawBills = await hRes.json();
                        /* Format decimals to standard JS numbers for app state */
                        const mappedBills = rawBills.map((b: any) => ({
                            ...b,
                            amount: parseFloat(b.amount),
                            discount: parseFloat(b.discount || 0),
                            items: b.items ? b.items.map((item: any) => ({ ...item, price: parseFloat(item.price) })) : []
                        }));
                        setBills(mappedBills);
                    } else { setBills([]); }

                    setGarageCustomers([]); // Owners don't see garage customers
                }
                else if (user.role === 'garage') {
                    // 1. Fetch Garage Customers
                    const cRes = await fetch(`/api/garages/customers?garageId=${user.id}`);
                    if (cRes.ok) {
                        const dbCustomers = await cRes.json();
                        setGarageCustomers(dbCustomers);
                    } else { setGarageCustomers([]); }

                    // 2. Fetch Garage Bills
                    const hRes = await fetch(`/api/history?userId=${user.id}&role=garage`);
                    if (hRes.ok) {
                        const rawBills = await hRes.json();
                        const mappedBills = rawBills.map((b: any) => ({
                            ...b,
                            amount: parseFloat(b.amount),
                            discount: parseFloat(b.discount || 0),
                            items: b.items ? b.items.map((item: any) => ({ ...item, price: parseFloat(item.price) })) : []
                        }));
                        setBills(mappedBills);
                    } else { setBills([]); }

                    setVehicles([]); // Garages don't manage their own fleet in this context
                    setParts([]);
                }
            } catch (error) {
                console.error("Data load error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [user?.id, user?.role]);

    const updateOdometer = async (vehicleId: string, newOdo: number) => {
        const updatedVehicles = vehicles.map(v => v.id === vehicleId ? { ...v, currentOdo: newOdo } : v);
        setVehicles(updatedVehicles);

        await fetch(`/api/vehicles/${vehicleId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentOdo: newOdo })
        });
    };

    const updateVehicleDates = async (vehicleId: string, revenueDate: string, insuranceDate: string, emissionReportDate: string) => {
        const updatedVehicles = vehicles.map(v =>
            v.id === vehicleId ? { ...v, revenueLicenseDate: revenueDate, insuranceDate, emissionReportDate } : v
        );
        setVehicles(updatedVehicles);

        let finalRevDate = revenueDate ? new Date(revenueDate).toISOString() : null;
        let finalInsDate = insuranceDate ? new Date(insuranceDate).toISOString() : null;
        let finalEmisDate = emissionReportDate ? new Date(emissionReportDate).toISOString() : null;

        await fetch(`/api/vehicles/${vehicleId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ revenueLicenseDate: finalRevDate, insuranceDate: finalInsDate, emissionReportDate: finalEmisDate })
        });
    };

    const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'ownerId'>): Promise<Vehicle> => {
        if (!user) throw new Error("Must be logged in to add a vehicle");

        const res = await fetch('/api/vehicles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicleData)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const newVehicle: Vehicle = {
            ...data
        };

        const updatedVehicles = [...vehicles, newVehicle];
        setVehicles(updatedVehicles);
        return newVehicle;
    };

    const transferVehicle = async (vehicleId: string, newOwnerEmail: string) => {
        const res = await fetch('/api/vehicles/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vehicleId, newOwnerEmail })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Transfer failed');

        // Remove from local state since they no longer own it
        setVehicles(vehicles.filter(v => v.id !== vehicleId));
    };

    const deleteVehicle = async (vehicleId: string) => {
        const res = await fetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Delete failed");

        setVehicles(vehicles.filter(v => v.id !== vehicleId));
    };

    const updateVehiclePhoto = async (vehicleId: string, photoDataUrl: string) => {
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, photo: photoDataUrl } : v));

        await fetch(`/api/vehicles/${vehicleId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo: photoDataUrl })
        });
    };

    const addGarageCustomer = async (customerData: Omit<GarageCustomer, 'id' | 'garageId'>, garageId: string = user?.id || ""): Promise<GarageCustomer> => {
        if (!garageId) throw new Error("Garage ID required to add customer");

        const res = await fetch('/api/garages/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ garageId, ...customerData })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const newCustomer: GarageCustomer = {
            ...data
        };

        setGarageCustomers([...garageCustomers, newCustomer]);
        return newCustomer;
    };

    const updateGarageCustomer = async (id: string, updates: Partial<GarageCustomer>) => {
        const res = await fetch(`/api/garages/customers/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!res.ok) throw new Error("Failed to update customer");

        const updated = garageCustomers.map(c => c.id === id ? { ...c, ...updates } : c);
        setGarageCustomers(updated);
    };

    const sendBill = async (billData: Omit<Bill, 'id' | 'status' | 'date' | 'source' | 'vehicleId'>) => {
        const res = await fetch('/api/bills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...billData, source: 'garage' })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const insertedBill = data;

        console.log("[sendBill] Step 4: Updating local state");
        const newBill: Bill = {
            ...billData,
            id: insertedBill.id,
            vehicleId: insertedBill.vehicleId || undefined,
            status: insertedBill.status as "pending" | "approved",
            source: "garage",
            date: insertedBill.date
        };

        setBills(prev => [newBill, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        console.log("[sendBill] COMPLETE");
    };

    const processRecordItems = async (vehicleId: string | undefined, items: ServiceItem[], billOdo?: number) => {
        if (!user?.id || user.role !== 'owner') return;
        try {
            const pRes = await fetch(`/api/parts?ownerId=${user.id}`);
            if (pRes.ok) {
                const dbParts = await pRes.json();
                setParts(dbParts);
            }
        } catch (error) {
            console.error("Failed to refresh parts:", error);
        }
    };

    const addManualRecord = async (recordData: Omit<Bill, 'id' | 'status' | 'date' | 'source'>) => {
        const res = await fetch('/api/bills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...recordData, source: 'owner', status: 'approved' })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const insertedBill = data;

        const newBill: Bill = {
            ...recordData,
            id: insertedBill.id,
            status: "approved",
            source: "owner",
            date: insertedBill.date
        };
        setBills([newBill, ...bills]);
        await processRecordItems(newBill.vehicleId, newBill.items, newBill.odometer);
    };

    const approveBill = async (billId: string, notes?: string, odometer?: number, items?: ServiceItem[], amount?: number) => {
        const bill = bills.find(b => b.id === billId);
        if (!bill) return;

        let currentVehicles = [...vehicles];
        const finalOdometer = odometer !== undefined ? odometer : bill.odometer;

        if (bill.vehicleId && finalOdometer) {
            const vehicleIndex = currentVehicles.findIndex(v => v.id === bill.vehicleId);
            if (vehicleIndex >= 0) {
                // Feature constraint: Ensure master odometer only goes forward on garage bill approval
                const nextOdo = Math.max(currentVehicles[vehicleIndex].currentOdo || 0, finalOdometer);
                if (nextOdo > currentVehicles[vehicleIndex].currentOdo) {
                    await updateOdometer(bill.vehicleId, nextOdo);
                }
            }
        }

        const dbUpdates: any = { status: 'approved' };
        if (notes !== undefined) dbUpdates.notes = notes;
        if (odometer !== undefined) dbUpdates.odometer = odometer;
        if (amount !== undefined) dbUpdates.amount = amount;

        let finalItems = bill.items;
        if (items) {
            dbUpdates.items = items;
            finalItems = items;
        }

        const res = await fetch(`/api/bills/${billId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbUpdates)
        });

        if (!res.ok) throw new Error("Failed to approve bill");

        const updated = bills.map(b => b.id === billId ? {
            ...b,
            status: "approved" as "approved",
            notes: notes !== undefined ? notes : b.notes,
            odometer: odometer !== undefined ? odometer : b.odometer,
            amount: amount !== undefined ? amount : b.amount,
            items: finalItems
        } : b);
        setBills(updated);

        await processRecordItems(bill.vehicleId, finalItems, finalOdometer);
    };

    const updateBill = async (billId: string, updatedData: Partial<Bill>) => {
        const dbUpdates: any = {};
        if (updatedData.amount !== undefined) dbUpdates.amount = updatedData.amount;
        if (updatedData.discount !== undefined) dbUpdates.discount = updatedData.discount;
        if (updatedData.odometer !== undefined) dbUpdates.odometer = updatedData.odometer;
        if (updatedData.notes !== undefined) dbUpdates.notes = updatedData.notes;
        if (updatedData.status !== undefined) dbUpdates.status = updatedData.status;
        if (updatedData.items) dbUpdates.items = updatedData.items;

        if (Object.keys(dbUpdates).length > 0) {
            const res = await fetch(`/api/bills/${billId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbUpdates)
            });
            if (!res.ok) throw new Error("Failed to update bill");
        }

        const updatedBills = bills.map(b => b.id === billId ? { ...b, ...updatedData } : b);
        setBills(updatedBills);

        const targetBill = bills.find(b => b.id === billId);
        if (updatedData.items && targetBill) {
            await processRecordItems(targetBill.vehicleId, updatedData.items, updatedData.odometer);
        }
    };

    const updatePart = async (partId: string, updatedData: Partial<Part>) => {
        const res = await fetch(`/api/parts/${partId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        if (!res.ok) throw new Error("Part update failed");

        const updatedParts = parts.map(p => p.id === partId ? { ...p, ...updatedData } : p);
        setParts(updatedParts);
    };

    const deletePart = async (partId: string) => {
        const res = await fetch(`/api/parts/${partId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Delete part failed");

        const updatedParts = parts.filter(p => p.id !== partId);
        setParts(updatedParts);
    };

    return (
        <VehicleContext.Provider value={{ vehicles, parts, bills, garageCustomers, updateOdometer, updateVehicleDates, updateVehiclePhoto, addVehicle, deleteVehicle, transferVehicle, addGarageCustomer, updateGarageCustomer, sendBill, updateBill, addManualRecord, approveBill, updatePart, deletePart, loading }}>
            {children}
        </VehicleContext.Provider>
    );
}

export function useVehicles() {
    const context = useContext(VehicleContext);
    if (context === undefined) {
        throw new Error("useVehicles must be used within a VehicleProvider");
    }
    return context;
}
