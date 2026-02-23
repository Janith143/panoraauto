"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabase";

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
    updateVehicleDates: (vehicleId: string, revenueDate: string, insuranceDate: string) => Promise<void>;
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
                    const { data: dbVehicles } = await supabase
                        .from('vehicles')
                        .select('*')
                        .eq('owner_id', user.id);

                    let mappedVehicles: Vehicle[] = [];
                    if (dbVehicles) {
                        mappedVehicles = dbVehicles.map(v => ({
                            id: v.id,
                            ownerId: v.owner_id,
                            make: v.make,
                            model: v.model,
                            year: v.year,
                            plate: v.plate,
                            currentOdo: v.current_odo,
                            revenueLicenseDate: v.revenue_license_date,
                            insuranceDate: v.insurance_date,
                            photo: v.photo
                        }));
                        setVehicles(mappedVehicles);
                    } else {
                        setVehicles([]);
                    }

                    // 2. Fetch Parts for those vehicles
                    const vehicleIds = mappedVehicles.map(v => v.id);
                    if (vehicleIds.length > 0) {
                        const { data: dbParts } = await supabase
                            .from('vehicle_parts')
                            .select('*')
                            .in('vehicle_id', vehicleIds);

                        if (dbParts) {
                            setParts(dbParts.map(p => ({
                                id: p.id,
                                vehicleId: p.vehicle_id,
                                name: p.name,
                                lastServiceOdo: p.last_service_odo,
                                lifespanOdo: p.lifespan_odo,
                                lastServiceDate: p.last_service_date,
                                lifespanMonths: p.lifespan_months
                            })));
                        } else {
                            setParts([]);
                        }

                        // 3. Fetch Bills/History for those vehicles
                        const { data: dbBills } = await supabase
                            .from('bills')
                            .select('*, service_items(*)')
                            .in('vehicle_id', vehicleIds)
                            .order('date', { ascending: false });

                        if (dbBills) {
                            setBills(dbBills.map((b: any) => ({
                                id: b.id,
                                vehicleId: b.vehicle_id,
                                garageCustomerId: b.garage_customer_id,
                                plate: b.plate,
                                garageId: b.garage_id,
                                amount: parseFloat(b.amount),
                                discount: parseFloat(b.discount || 0),
                                odometer: b.odometer,
                                notes: b.notes,
                                status: b.status,
                                source: b.source,
                                date: b.date,
                                photos: b.photos,
                                items: b.service_items ? b.service_items.map((item: any) => ({
                                    name: item.name,
                                    price: parseFloat(item.price),
                                    lifespanOdo: item.lifespan_odo,
                                    lifespanMonths: item.lifespan_months
                                })) : []
                            })));
                        } else {
                            setBills([]);
                        }
                    } else {
                        setParts([]);
                        setBills([]);
                    }
                    setGarageCustomers([]); // Owners don't see garage customers
                }
                else if (user.role === 'garage') {
                    // 1. Fetch Garage Customers
                    const { data: dbCustomers } = await supabase
                        .from('garage_customers')
                        .select('*')
                        .eq('garage_id', user.id);

                    if (dbCustomers) {
                        setGarageCustomers(dbCustomers.map(c => ({
                            id: c.id,
                            garageId: c.garage_id,
                            make: c.make,
                            model: c.model,
                            year: c.year,
                            plate: c.plate,
                            phone: c.phone,
                            ownerName: c.owner_name,
                            notes: c.notes,
                            odometer: c.odometer
                        })));
                    } else {
                        setGarageCustomers([]);
                    }

                    // 2. Fetch Garage Bills
                    const { data: dbBills } = await supabase
                        .from('bills')
                        .select('*, service_items(*)')
                        .eq('garage_id', user.id)
                        .order('date', { ascending: false });

                    if (dbBills) {
                        setBills(dbBills.map((b: any) => ({
                            id: b.id,
                            vehicleId: b.vehicle_id,
                            garageCustomerId: b.garage_customer_id,
                            plate: b.plate,
                            garageId: b.garage_id,
                            amount: parseFloat(b.amount),
                            discount: parseFloat(b.discount || 0),
                            odometer: b.odometer,
                            notes: b.notes,
                            status: b.status,
                            source: b.source,
                            date: b.date,
                            photos: b.photos,
                            items: b.service_items ? b.service_items.map((item: any) => ({
                                name: item.name,
                                price: parseFloat(item.price),
                                lifespanOdo: item.lifespan_odo,
                                lifespanMonths: item.lifespan_months
                            })) : []
                        })));
                    } else {
                        setBills([]);
                    }

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
        // Optimistically update UI
        const updatedVehicles = vehicles.map(v =>
            v.id === vehicleId ? { ...v, currentOdo: newOdo } : v
        );
        setVehicles(updatedVehicles);

        // Update Supabase
        await supabase
            .from('vehicles')
            .update({ current_odo: newOdo })
            .eq('id', vehicleId);
    };

    const updateVehicleDates = async (vehicleId: string, revenueDate: string, insuranceDate: string) => {
        // Optimistically update UI
        const updatedVehicles = vehicles.map(v =>
            v.id === vehicleId ? { ...v, revenueLicenseDate: revenueDate, insuranceDate } : v
        );
        setVehicles(updatedVehicles);

        // Update Supabase
        await supabase
            .from('vehicles')
            .update({ revenue_license_date: revenueDate, insurance_date: insuranceDate })
            .eq('id', vehicleId);
    };

    const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'ownerId'>): Promise<Vehicle> => {
        if (!user) throw new Error("Must be logged in to add a vehicle");

        // Ensure owner profile exists just-in-time
        try {
            const { data: existingOwner, error: selErr } = await supabase.from('owners').select('id').eq('id', user.id).maybeSingle();
            if (selErr) {
                console.error("Owner Check Error:", selErr);
                throw new Error(`Failed to check owner profile: ${selErr.message}`);
            }

            if (!existingOwner) {
                // Check if an obsolete profile with the same email already exists (e.g. from deleting user in Auth but not DB)
                const { data: existingEmailProfile } = await supabase.from('owners').select('id').eq('email', user.email).maybeSingle();

                if (existingEmailProfile) {
                    // Update the old profile's ID to match the new Auth ID
                    const { error: updateErr } = await supabase.from('owners').update({ id: user.id }).eq('email', user.email);
                    if (updateErr) {
                        throw new Error(`Failed to map existing email profile to new ID: ${updateErr.message}`);
                    }
                } else {
                    // It's a truly new user, insert them 
                    const { error: insertErr } = await supabase.from('owners').insert({
                        id: user.id,
                        email: user.email,
                        full_name: user.name || "Unknown Owner"
                    });
                    if (insertErr) {
                        console.error("Owner Just-In-Time Insert Error:", insertErr);
                        throw new Error(`Owner Profile Creation Failed: ${insertErr.message} | Details: ${insertErr.details}`);
                    }
                }
            }
        } catch (err: any) {
            console.error("Owner Init Exception:", err);
            throw new Error(`Profile Init Error: ${err.message}`);
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('vehicles')
            .insert([{
                owner_id: user.id,
                make: vehicleData.make,
                model: vehicleData.model,
                year: vehicleData.year,
                plate: vehicleData.plate.toUpperCase(),
                current_odo: vehicleData.currentOdo
            }])
            .select();

        if (error) {
            console.error("Vehicle Insert Error:", error);
            throw new Error(`Supabase Error: ${error.message} | Details: ${error.details || 'None'} | Hint: ${error.hint || 'None'}`);
        }

        const dbVehicle = data[0];
        const newVehicle: Vehicle = {
            id: dbVehicle.id,
            ownerId: dbVehicle.owner_id,
            make: dbVehicle.make,
            model: dbVehicle.model,
            year: dbVehicle.year,
            plate: dbVehicle.plate,
            currentOdo: dbVehicle.current_odo,
            revenueLicenseDate: dbVehicle.revenue_license_date,
            insuranceDate: dbVehicle.insurance_date,
            photo: dbVehicle.photo
        };

        const updatedVehicles = [...vehicles, newVehicle];
        setVehicles(updatedVehicles);
        return newVehicle;
    };

    const transferVehicle = async (vehicleId: string, newOwnerEmail: string) => {
        // Find new owner by email
        const { data: newOwner, error: ownerErr } = await supabase
            .from('owners')
            .select('id')
            .eq('email', newOwnerEmail.toLowerCase().trim())
            .maybeSingle();

        if (ownerErr) {
            console.error("Owner Lookup Error:", ownerErr);
            throw new Error(`Failed to lookup new owner: ${ownerErr.message}`);
        }

        if (!newOwner) {
            throw new Error(`No owner found with email: ${newOwnerEmail}`);
        }

        // Transfer vehicle to new owner
        const { error: transferErr } = await supabase
            .from('vehicles')
            .update({ owner_id: newOwner.id })
            .eq('id', vehicleId);

        if (transferErr) {
            console.error("Vehicle Transfer Error:", transferErr);
            throw new Error(`Failed to transfer vehicle: ${transferErr.message}`);
        }

        // Remove from current local state
        setVehicles(vehicles.filter(v => v.id !== vehicleId));
        setParts(parts.filter(p => p.vehicleId !== vehicleId));
        setBills(bills.filter(b => b.vehicleId !== vehicleId));
    };

    const deleteVehicle = async (vehicleId: string) => {
        const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
        if (error) {
            console.error("Vehicle Delete Error:", error);
            throw new Error(`Supabase Error: ${error.message}`);
        }
        setVehicles(vehicles.filter(v => v.id !== vehicleId));
        // Note: Bills have ON DELETE SET NULL for vehicle_id, so they will be detached but stay for garages. 
    };

    const updateVehiclePhoto = async (vehicleId: string, photoDataUrl: string) => {
        const { error } = await supabase
            .from('vehicles')
            .update({ photo: photoDataUrl })
            .eq('id', vehicleId);

        if (error) {
            console.error("Vehicle Photo Update Error:", error);
            throw new Error(`Supabase Error: ${error.message}`);
        }

        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, photo: photoDataUrl } : v));
    };

    const addGarageCustomer = async (customerData: Omit<GarageCustomer, 'id' | 'garageId'>, garageId: string = user?.id || ""): Promise<GarageCustomer> => {
        if (!garageId) throw new Error("Garage ID required to add customer");

        // Validate that 'phone' is present, it's not strictly NOT NULL in schema, but good to check
        const { data, error } = await supabase
            .from('garage_customers')
            .insert([{
                garage_id: garageId,
                make: customerData.make,
                model: customerData.model,
                year: customerData.year,
                plate: customerData.plate,
                phone: customerData.phone || null,
                owner_name: customerData.ownerName || null,
                notes: customerData.notes || null,
                odometer: customerData.odometer || null
            }])
            .select();

        if (error) {
            console.error("Garage Customer Insert Error:", error);
            throw new Error(`Supabase Error: ${error.message} | Details: ${error.details || 'None'} | Hint: ${error.hint || 'None'}`);
        }

        const c = data[0];
        const newCustomer: GarageCustomer = {
            id: c.id,
            garageId: c.garage_id,
            make: c.make,
            model: c.model,
            year: c.year,
            plate: c.plate,
            phone: c.phone,
            ownerName: c.owner_name,
            notes: c.notes,
            odometer: c.odometer
        };

        setGarageCustomers([...garageCustomers, newCustomer]);
        return newCustomer;
    };

    const updateGarageCustomer = async (id: string, updates: Partial<GarageCustomer>) => {
        const dbUpdates: any = {};
        if (updates.make) dbUpdates.make = updates.make;
        if (updates.model) dbUpdates.model = updates.model;
        if (updates.year) dbUpdates.year = updates.year;
        if (updates.plate) dbUpdates.plate = updates.plate;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.ownerName !== undefined) dbUpdates.owner_name = updates.ownerName;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.odometer !== undefined) dbUpdates.odometer = updates.odometer;

        const { error } = await supabase
            .from('garage_customers')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;

        const updated = garageCustomers.map(c => c.id === id ? { ...c, ...updates } : c);
        setGarageCustomers(updated);
    };

    const sendBill = async (billData: Omit<Bill, 'id' | 'status' | 'date' | 'source' | 'vehicleId'>) => {
        let vehicleId = null;
        let status = "approved";

        // Try to look up vehicle owner — but don't block bill creation if this fails
        if (billData.plate) {
            try {
                const normalizedPlate = billData.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                console.log("[sendBill] Step 1: Looking up vehicle plate:", normalizedPlate);

                // Race the query against a 5-second timeout
                const lookupPromise = supabase
                    .from('vehicles')
                    .select('id')
                    .eq('plate', normalizedPlate)
                    .maybeSingle();

                const timeoutPromise = new Promise<{ data: null; error: null }>((resolve) =>
                    setTimeout(() => { console.warn("[sendBill] Vehicle lookup timed out after 5s"); resolve({ data: null, error: null }); }, 5000)
                );

                const { data: matchingVehicle } = await Promise.race([lookupPromise, timeoutPromise]);
                console.log("[sendBill] Step 1 done. match:", matchingVehicle);

                if (matchingVehicle && matchingVehicle.id) {
                    vehicleId = matchingVehicle.id;
                    status = "pending";
                }
            } catch (lookupErr) {
                console.warn("[sendBill] Vehicle lookup failed, proceeding with approved status:", lookupErr);
            }
        }

        console.log("[sendBill] Step 2: Inserting bill. status:", status, "vehicleId:", vehicleId);

        const insertPromise = supabase
            .from('bills')
            .insert([{
                garage_id: billData.garageId,
                garage_customer_id: billData.garageCustomerId,
                vehicle_id: vehicleId,
                plate: billData.plate,
                amount: billData.amount,
                discount: billData.discount,
                odometer: billData.odometer,
                notes: billData.notes,
                status: status,
                source: "garage",
                photos: billData.photos
            }])
            .select();

        const insertTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Database connection timed out (10s). If this is on a VPS, ensure you have a .env file and have REBUILT the app using 'npm run build'. Your Supabase project might also be paused.")), 10000)
        );

        const { data: billRes, error: billErr } = await Promise.race([insertPromise, insertTimeout]);

        console.log("[sendBill] Step 2 done. billRes:", billRes, "billErr:", billErr);

        if (billErr) {
            console.error("Bill Insert Error:", billErr);
            throw new Error(`Supabase Error: ${billErr.message} | Details: ${billErr.details || 'None'} | Hint: ${billErr.hint || 'None'}`);
        }
        if (!billRes || billRes.length === 0) {
            console.error("Bill Insert returned no data. billRes:", billRes);
            throw new Error("Invoice was not created — no data returned from database. Check RLS policies or table permissions.");
        }
        const insertedBill = billRes[0];

        if (billData.items && billData.items.length > 0) {
            console.log("[sendBill] Step 3: Inserting", billData.items.length, "service items for bill:", insertedBill.id);
            const itemsToInsert = billData.items.map(item => ({
                bill_id: insertedBill.id,
                name: item.name,
                price: item.price,
                lifespan_odo: item.lifespanOdo,
                lifespan_months: item.lifespanMonths
            }));

            const itemsInsertPromise = supabase.from('service_items').insert(itemsToInsert);
            const itemsTimeout = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Service items insert timed out (10s). If this is on a VPS, ensure you have a proper .env file and have REBUILT the app.")), 10000)
            );

            const { error: itemsErr } = await Promise.race([itemsInsertPromise, itemsTimeout]);
            console.log("[sendBill] Step 3 done. itemsErr:", itemsErr);
            if (itemsErr) {
                console.error("Service Items Insert Error:", itemsErr);
                throw new Error(`Supabase Items Error: ${itemsErr.message} | Details: ${itemsErr.details || 'None'}`);
            }
        }

        console.log("[sendBill] Step 4: Updating local state");
        const newBill: Bill = {
            ...billData,
            id: insertedBill.id,
            vehicleId: vehicleId || undefined,
            status: status as "pending" | "approved",
            source: "garage",
            date: insertedBill.date
        };

        setBills(prev => [newBill, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        console.log("[sendBill] COMPLETE");
    };

    const processRecordItems = async (vehicleId: string | undefined, items: ServiceItem[], billOdo?: number) => {
        if (!vehicleId) return;
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;

        for (const item of items) {
            if (item.lifespanOdo || item.lifespanMonths) {
                const existingPart = parts.find(p => p.vehicleId === vehicleId && p.name.toLowerCase() === item.name.toLowerCase());
                if (existingPart) {
                    await updatePart(existingPart.id, {
                        ...item.lifespanOdo ? { lastServiceOdo: billOdo ?? vehicle.currentOdo, lifespanOdo: item.lifespanOdo } : {},
                        ...item.lifespanMonths ? { lastServiceDate: new Date().toISOString(), lifespanMonths: item.lifespanMonths } : {}
                    });
                } else {
                    const { data, error } = await supabase
                        .from('vehicle_parts')
                        .insert([{
                            vehicle_id: vehicleId,
                            name: item.name,
                            last_service_odo: item.lifespanOdo ? (billOdo ?? vehicle.currentOdo) : 0,
                            lifespan_odo: item.lifespanOdo || 0,
                            last_service_date: item.lifespanMonths ? new Date().toISOString() : null,
                            lifespan_months: item.lifespanMonths || null
                        }])
                        .select();

                    if (!error && data) {
                        const newPart = {
                            id: data[0].id,
                            vehicleId: data[0].vehicle_id,
                            name: data[0].name,
                            lastServiceOdo: data[0].last_service_odo,
                            lifespanOdo: data[0].lifespan_odo,
                            lastServiceDate: data[0].last_service_date,
                            lifespanMonths: data[0].lifespan_months
                        };
                        setParts(prev => [...prev, newPart]);
                    }
                }
            }
        }
    };

    const addManualRecord = async (recordData: Omit<Bill, 'id' | 'status' | 'date' | 'source'>) => {
        const { data: billRes, error: billErr } = await supabase
            .from('bills')
            .insert([{
                garage_id: recordData.garageId,
                vehicle_id: recordData.vehicleId,
                plate: recordData.plate,
                amount: recordData.amount,
                discount: recordData.discount,
                odometer: recordData.odometer,
                notes: recordData.notes,
                status: "approved",
                source: "owner",
                photos: recordData.photos
            }])
            .select();

        if (billErr) {
            console.error("Manual Record Insert Error:", billErr);
            throw new Error(`Supabase Error: ${billErr.message} | Details: ${billErr.details || 'None'} | Hint: ${billErr.hint || 'None'}`);
        }
        const insertedBill = billRes[0];

        if (recordData.items && recordData.items.length > 0) {
            const itemsToInsert = recordData.items.map(item => ({
                bill_id: insertedBill.id,
                name: item.name,
                price: item.price,
                lifespan_odo: item.lifespanOdo,
                lifespan_months: item.lifespanMonths
            }));
            const { error: itemsErr } = await supabase.from('service_items').insert(itemsToInsert);
            if (itemsErr) {
                console.error("Service Items Insert Error:", itemsErr);
                throw new Error(`Supabase Items Error: ${itemsErr.message} | Details: ${itemsErr.details || 'None'}`);
            }
        }

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

        const { error: billErr } = await supabase
            .from('bills')
            .update(dbUpdates)
            .eq('id', billId);

        if (billErr) throw billErr;

        // If items were edited, we replace them in Supabase
        let finalItems = bill.items;
        if (items) {
            // Delete old items
            await supabase.from('service_items').delete().eq('bill_id', billId);
            // Insert new ones
            if (items.length > 0) {
                const itemsToInsert = items.map(item => ({
                    bill_id: billId,
                    name: item.name,
                    price: item.price,
                    lifespan_odo: item.lifespanOdo,
                    lifespan_months: item.lifespanMonths
                }));
                const { error: itemsErr } = await supabase.from('service_items').insert(itemsToInsert);
                if (itemsErr) throw itemsErr;
            }
            finalItems = items;
        }

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

        if (Object.keys(dbUpdates).length > 0) {
            const { error } = await supabase.from('bills').update(dbUpdates).eq('id', billId);
            if (error) throw error;
        }

        // If items were updated, replace them in service_items table
        if (updatedData.items) {
            await supabase.from('service_items').delete().eq('bill_id', billId);
            if (updatedData.items.length > 0) {
                const itemsToInsert = updatedData.items.map(item => ({
                    bill_id: billId,
                    name: item.name,
                    price: item.price,
                    lifespan_odo: item.lifespanOdo,
                    lifespan_months: item.lifespanMonths
                }));
                const { error: itemsErr } = await supabase.from('service_items').insert(itemsToInsert);
                if (itemsErr) throw itemsErr;
            }
        }

        const updatedBills = bills.map(b => b.id === billId ? { ...b, ...updatedData } : b);
        setBills(updatedBills);

        const targetBill = bills.find(b => b.id === billId);
        if (updatedData.items && targetBill) {
            await processRecordItems(targetBill.vehicleId, updatedData.items, updatedData.odometer);
        }
    };

    const updatePart = async (partId: string, updatedData: Partial<Part>) => {
        const dbUpdates: any = {};
        if (updatedData.name !== undefined) dbUpdates.name = updatedData.name;
        if (updatedData.lastServiceOdo !== undefined) dbUpdates.last_service_odo = updatedData.lastServiceOdo;
        if (updatedData.lifespanOdo !== undefined) dbUpdates.lifespan_odo = updatedData.lifespanOdo;
        if (updatedData.lastServiceDate !== undefined) dbUpdates.last_service_date = updatedData.lastServiceDate;
        if (updatedData.lifespanMonths !== undefined) dbUpdates.lifespan_months = updatedData.lifespanMonths;

        if (Object.keys(dbUpdates).length > 0) {
            const { error } = await supabase.from('vehicle_parts').update(dbUpdates).eq('id', partId);
            if (error) throw error;
        }

        const updatedParts = parts.map(p => p.id === partId ? { ...p, ...updatedData } : p);
        setParts(updatedParts);
    };

    const deletePart = async (partId: string) => {
        const { error } = await supabase.from('vehicle_parts').delete().eq('id', partId);
        if (error) throw error;

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
