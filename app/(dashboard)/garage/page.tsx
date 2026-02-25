"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useVehicles, GarageCustomer, ServiceItem, Bill } from "@/app/context/VehicleContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from "@/app/components/ui";
import { Search, CheckCircle, Plus, Trash2, TrendingUp, Calendar, Filter, DollarSign } from "lucide-react";

export default function GarageDashboard() {
    const { user, loading: authLoading } = useAuth();
    const { garageCustomers, bills, vehicles, sendBill, updateBill, addGarageCustomer, updateGarageCustomer, loading: dataLoading } = useVehicles();
    const [searchPlate, setSearchPlate] = useState("");
    const [foundCustomer, setFoundCustomer] = useState<GarageCustomer | null>(null);
    const [showRegister, setShowRegister] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

    // Editing bill state
    const [editingBillId, setEditingBillId] = useState<string | null>(null);
    const [editItems, setEditItems] = useState<ServiceItem[]>([]);
    const [editServiceCost, setEditServiceCost] = useState<number>(0);
    const [editOdo, setEditOdo] = useState<string>("");
    const [editNotes, setEditNotes] = useState<string>("");
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Registration state
    const [newMake, setNewMake] = useState("");
    const [newModel, setNewModel] = useState("");
    const [newYear, setNewYear] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [newOwnerName, setNewOwnerName] = useState("");
    const [newNotes, setNewNotes] = useState("");
    const [newOdo, setNewOdo] = useState("");

    const [items, setItems] = useState<ServiceItem[]>([
        { name: "", price: 0, qty: 1, lifespanOdo: undefined, lifespanMonths: undefined }
    ]);
    const [serviceCost, setServiceCost] = useState<number>(0);
    const [sent, setSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serviceOdo, setServiceOdo] = useState<string>("");
    const [billNotes, setBillNotes] = useState("");
    const [billPhotos, setBillPhotos] = useState<string[]>([]);
    const [lastCompletedBill, setLastCompletedBill] = useState<Bill | null>(null);
    const [printBill, setPrintBill] = useState<Bill | null>(null);

    // Sales dashboard state
    const [showSalesDashboard, setShowSalesDashboard] = useState(false);
    const [salesSearch, setSalesSearch] = useState("");
    const [salesDateFilter, setSalesDateFilter] = useState("all");

    if (authLoading || dataLoading) return null;

    const normalizePlate = (plate: string) => plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const c = garageCustomers.find(c => normalizePlate(c.plate) === normalizePlate(searchPlate));
        setFoundCustomer(c || null);
        setShowRegister(false);
        setHasSearched(true);
        setSent(false);
        setIsSubmitting(false);
        setLastCompletedBill(null);
        setIsEditingProfile(false);

        if (c) {
            setNewPhone(c.phone || "");
            setNewOwnerName(c.ownerName || "");
            setNewNotes(c.notes || "");
            setNewOdo(c.odometer ? c.odometer.toString() : "");
        } else {
            setNewMake(""); setNewModel(""); setNewYear(""); setNewPhone(""); setNewOwnerName(""); setNewNotes(""); setNewOdo("");
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log("Saving new customer:", searchPlate);
            const normalizedPlate = normalizePlate(searchPlate);
            const c = await addGarageCustomer({
                make: newMake,
                model: newModel,
                year: parseInt(newYear, 10),
                plate: normalizedPlate,
                phone: newPhone,
                ownerName: newOwnerName,
                notes: newNotes
            });
            console.log("Customer saved:", c);
            setFoundCustomer(c);
            setShowRegister(false);
        } catch (err: any) {
            console.error("Caught Exception registering garage customer:", err);
            if (err.message && err.message.includes('duplicate key value violates unique constraint')) {
                alert(`Vehicle with plate ${searchPlate.toUpperCase()} is already registered to your garage! Please search for it above.`);
            } else {
                alert(`Failed to register customer: ${err.message || "Unknown error"}`);
            }
        }
    };

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (foundCustomer) {
            updateGarageCustomer(foundCustomer.id, {
                phone: newPhone,
                ownerName: newOwnerName,
                notes: newNotes,
                odometer: newOdo ? parseInt(newOdo, 10) : undefined
            });
            setFoundCustomer({ ...foundCustomer, phone: newPhone, ownerName: newOwnerName, notes: newNotes, odometer: newOdo ? parseInt(newOdo, 10) : undefined });
            setIsEditingProfile(false);
        }
    };

    const addItem = () => setItems([...items, { name: "", price: 0, qty: 1 }]);
    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

    const updateItem = (idx: number, field: keyof ServiceItem, val: string | number | undefined) => {
        const newItems = [...items];
        newItems[idx] = { ...newItems[idx], [field]: val };
        setItems(newItems);
    };

    const totalItemsAmount = items.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || 1)), 0);
    const grandTotal = Math.max(0, totalItemsAmount + serviceCost);

    // Editing helpers
    const startEditBill = (bill: Bill) => {
        setEditingBillId(bill.id);
        setEditItems(bill.items.map(i => ({ ...i })));
        setEditServiceCost(bill.discount && bill.discount < 0 ? Math.abs(bill.discount) : 0);
        setEditOdo(bill.odometer ? bill.odometer.toString() : "");
        setEditNotes(bill.notes || "");
    };
    const cancelEditBill = () => {
        setEditingBillId(null);
        setEditItems([]);
        setEditServiceCost(0);
        setEditOdo("");
        setEditNotes("");
    };
    const updateEditItem = (idx: number, field: keyof ServiceItem, val: string | number | undefined) => {
        const ni = [...editItems];
        ni[idx] = { ...ni[idx], [field]: val };
        setEditItems(ni);
    };
    const editItemsTotal = editItems.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || 1)), 0);
    const editGrandTotal = Math.max(0, editItemsTotal + editServiceCost);

    const handleSaveEditBill = async (billId: string) => {
        if (isSavingEdit) return;
        setIsSavingEdit(true);
        try {
            await updateBill(billId, {
                items: editItems.filter(i => i.name.trim() !== ""),
                amount: editGrandTotal,
                discount: editServiceCost > 0 ? -editServiceCost : undefined,
                odometer: editOdo ? parseInt(editOdo, 10) : undefined,
                notes: editNotes.trim() || undefined
            });
            setEditingBillId(null);
        } catch (err: any) {
            alert(`Failed to update invoice: ${err.message || "Unknown error"}`);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const generateWhatsAppLink = (bill: Bill, phone: string) => {
        const garageName = (user as any)?.user_metadata?.garage_name || "AutoLog Partner";
        const date = new Date(bill.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const items = bill.items || [];
        const subtotal = items.reduce((sum, i) => sum + ((i.price || 0) * (i.qty || 1)), 0);
        const discount = bill.discount || 0;

        let message = `🔧 *${garageName}*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n`;
        message += `*SERVICE INVOICE*\n\n`;
        message += `🚗 *Vehicle:* ${bill.plate}\n`;
        message += `📅 *Date:* ${date}\n`;
        if (bill.odometer) message += `📊 *Odometer:* ${bill.odometer} km\n`;
        message += `\n`;
        message += `📋 *Service Details:*\n`;
        message += `────────────────────\n`;
        items.forEach((item, idx) => {
            const qty = item.qty || 1;
            const lineTotal = (item.price || 0) * qty;
            message += `${idx + 1}. ${item.name}`;
            if (qty > 1) message += ` (×${qty})`;
            message += `\n   Rs ${lineTotal.toFixed(2)}\n`;
        });
        message += `────────────────────\n`;
        if (discount < 0) {
            message += `   Subtotal: Rs ${subtotal.toFixed(2)}\n`;
            message += `   Service Cost: +Rs ${Math.abs(discount).toFixed(2)}\n`;
        } else if (discount > 0) {
            message += `   Subtotal: Rs ${subtotal.toFixed(2)}\n`;
            message += `   Discount: -Rs ${discount.toFixed(2)}\n`;
        }
        message += `💰 *Total: Rs ${bill.amount.toFixed(2)}*\n\n`;
        if (bill.notes) message += `📝 _${bill.notes}_\n\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n`;
        message += `Thank you for choosing *${garageName}*!\nYour service record is saved on AutoLog Connect.`;

        const phoneNum = phone.replace(/\D/g, '');
        return `https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`;
    };

    // Check if the searched plate exists as a registered Owner Vehicle
    const isOwnerRegistered = vehicles.some(v => normalizePlate(v.plate) === normalizePlate(searchPlate));

    const handleSendBill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!foundCustomer || isSubmitting) return;

        setIsSubmitting(true);
        const currentOdo = serviceOdo ? parseInt(serviceOdo, 10) : undefined;

        try {
            const filteredItems = items.filter(i => i.name.trim() !== "").map(i => ({
                ...i,
                lifespanOdo: i.lifespanOdo ? i.lifespanOdo : undefined,
                lifespanMonths: i.lifespanMonths ? i.lifespanMonths : undefined
            }));

            const billToCreate = {
                plate: foundCustomer.plate,
                garageId: foundCustomer.garageId,
                garageCustomerId: foundCustomer.id,
                amount: grandTotal,
                discount: serviceCost > 0 ? -serviceCost : undefined,
                odometer: currentOdo,
                notes: billNotes.trim() !== "" ? billNotes : undefined,
                items: filteredItems,
                photos: billPhotos.length > 0 ? billPhotos : undefined
            };

            console.log("[Invoice] Sending bill:", JSON.stringify(billToCreate, null, 2));
            await sendBill(billToCreate);
            console.log("[Invoice] Bill sent successfully");

            // Update the garage customer's last known odometer automatically if strictly greater
            if (currentOdo) {
                const cOdo = foundCustomer.odometer || 0;
                const newOdo = Math.max(currentOdo, cOdo);
                if (newOdo > cOdo || !foundCustomer.odometer) {
                    await updateGarageCustomer(foundCustomer.id, { odometer: newOdo });
                    setFoundCustomer({ ...foundCustomer, odometer: newOdo });
                }
            }

            setLastCompletedBill({ ...billToCreate, id: "recent", date: new Date().toISOString(), status: "pending", source: "garage" });
            setSent(true);
            setItems([{ name: "", price: 0, qty: 1, lifespanOdo: undefined, lifespanMonths: undefined }]);
            setServiceCost(0);
            setServiceOdo("");
            setBillNotes("");
            setBillPhotos([]);
            console.log("[Invoice] Success state set");
        } catch (err: any) {
            console.error("[Invoice] FAILED:", err);
            alert(`Failed to send invoice: ${err.message || err.toString() || "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Sales metrics calculations
    const garageBills = bills.filter(b => b.source === "garage" && b.garageId === user?.id);
    // Default to approved or all depending on business logic - assuming all sent bills (even pending approval from owner) count as garage activity, or just approved. Let's include all garage generated bills for now, or maybe emphasize 'approved'. We'll show all.
    let filteredSales = garageBills;
    if (salesSearch.trim()) {
        const q = salesSearch.toLowerCase();
        filteredSales = filteredSales.filter(b =>
            (b.plate && b.plate.toLowerCase().includes(q)) ||
            b.items.some(i => i.name.toLowerCase().includes(q))
        );
    }
    if (salesDateFilter !== "all") {
        const now = new Date();
        filteredSales = filteredSales.filter(b => {
            const bDate = new Date(b.date);
            if (salesDateFilter === "today") {
                return bDate.toDateString() === now.toDateString();
            } else if (salesDateFilter === "week") {
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return bDate >= weekAgo;
            } else if (salesDateFilter === "month") {
                return bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }
    const totalSalesAmount = filteredSales.reduce((sum, b) => sum + b.amount, 0);

    const handleBillPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newPhotos: string[] = [];
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    newPhotos.push(reader.result as string);
                    // If this is the last file, update state
                    if (newPhotos.length === e.target.files?.length) {
                        setBillPhotos(prev => [...prev, ...newPhotos]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handlePrint = (bill: Bill) => {
        setPrintBill(bill);
        setTimeout(() => window.print(), 100);
    };

    return (
        <>
            <div className="w-full max-w-5xl mx-auto space-y-6 print:hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                            {showSalesDashboard ? "Garage Sales Dashboard" : "POS Interface"}
                        </h2>
                        <p className="text-foreground/70">
                            {showSalesDashboard ? "Review total sales and filter past invoices." : "Search plates and create digital invoices."}
                        </p>
                    </div>
                    <Button
                        variant={showSalesDashboard ? "ghost" : "primary"}
                        className="shrink-0"
                        onClick={() => setShowSalesDashboard(!showSalesDashboard)}
                    >
                        {showSalesDashboard ? (
                            <>Back to POS</>
                        ) : (
                            <><TrendingUp size={16} className="mr-2" /> Total Sales</>
                        )}
                    </Button>
                </div>

                {showSalesDashboard ? (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-primary/10 border-primary/30">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-foreground/70 mb-1">Total Sales Amount</p>
                                            <h3 className="text-4xl font-mono font-bold text-primary">Rs {totalSalesAmount.toFixed(2)}</h3>
                                        </div>
                                        <div className="p-3 bg-primary/20 rounded-full text-primary">
                                            <DollarSign size={24} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-foreground/50 mt-4">Based on current filters ({filteredSales.length} invoices)</p>
                                </CardContent>
                            </Card>
                            <Card className="md:col-span-2">
                                <CardContent className="p-6 flex flex-col justify-center h-full space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={16} />
                                            <Input
                                                placeholder="Search by Plate or Line Item..."
                                                value={salesSearch}
                                                onChange={(e: any) => setSalesSearch(e.target.value)}
                                                className="pl-10 base-input"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            {(['all', 'today', 'week', 'month'] as const).map(filter => (
                                                <Button
                                                    key={filter}
                                                    type="button"
                                                    variant={salesDateFilter === filter ? "primary" : "ghost"}
                                                    size="sm"
                                                    onClick={() => setSalesDateFilter(filter)}
                                                    className="capitalize h-10 px-3"
                                                >
                                                    {filter}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Invoice Pipeline</CardTitle>
                                <CardDescription>Recent generated bills matching your filters.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {filteredSales.length === 0 ? (
                                        <p className="text-center text-foreground/50 py-8">No invoices match your exact criteria.</p>
                                    ) : (
                                        filteredSales.slice().reverse().map(bill => {
                                            const isExpanded = expandedBillId === bill.id;
                                            return (
                                                <div
                                                    key={bill.id}
                                                    className="p-4 bg-background border border-panel-border rounded-lg gap-4 cursor-pointer hover:border-primary/50 transition-all"
                                                    onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                                                >
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <span className="font-bold text-lg">{bill.plate}</span>
                                                                {bill.status === "approved" ? (
                                                                    <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle size={10} /> Approved</span>
                                                                ) : (
                                                                    <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded">Pending Approval</span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-foreground/50 flex flex-wrap gap-2">
                                                                <span>{new Date(bill.date).toLocaleString()}</span>
                                                                {!isExpanded && <span>• {bill.items.length} Items</span>}
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            {bill.discount && bill.discount < 0 ? (
                                                                <div className="text-xs text-primary mb-1">Cost: +Rs {Math.abs(bill.discount).toFixed(2)}</div>
                                                            ) : bill.discount && bill.discount > 0 ? (
                                                                <div className="text-xs text-success mb-1">Discount: -Rs {bill.discount.toFixed(2)}</div>
                                                            ) : null}
                                                            <div className="font-mono font-bold text-xl text-primary">Rs {bill.amount.toFixed(2)}</div>
                                                        </div>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className="mt-4 pt-4 border-t border-panel-border space-y-3 animate-in fade-in slide-in-from-top-2">
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">Service Line Items</p>
                                                                {bill.items.map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between items-center text-sm bg-panel/30 p-2 rounded">
                                                                        <span>{item.name}</span>
                                                                        <div className="flex gap-4">
                                                                            {item.lifespanOdo && <span className="text-foreground/50 font-mono text-xs">+{item.lifespanOdo}mi</span>}
                                                                            <span className="text-foreground/70 font-mono">Rs {item.price.toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="flex justify-between items-end bg-panel/30 p-3 rounded mt-2">
                                                                <div className="space-y-1">
                                                                    {bill.odometer && <p className="text-xs text-foreground/70"><span className="text-foreground/40">Recorded Odometer:</span> {bill.odometer.toLocaleString()} mi</p>}
                                                                    {bill.notes && <p className="text-xs text-foreground/70"><span className="text-foreground/40">Invoice Notes:</span> {bill.notes}</p>}
                                                                    {!bill.odometer && !bill.notes && <p className="text-xs text-foreground/40 italic">No additional details recorded.</p>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Create Bill Handshake</CardTitle>
                                <CardDescription>Search by license plate to attach service evidence.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <form onSubmit={handleSearch} className="flex gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50" size={20} />
                                        <Input
                                            type="text"
                                            placeholder="Enter License Plate (e.g. EV-8821)"
                                            className="pl-12 font-mono uppercase"
                                            value={searchPlate}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearchPlate(e.target.value); setHasSearched(false); }}
                                            list="plate-search-history"
                                            autoComplete="off"
                                        />
                                        <datalist id="plate-search-history">
                                            {Array.from(new Set([...garageCustomers.map(c => c.plate), ...vehicles.map(v => v.plate)])).map((plate, i) => (
                                                <option key={i} value={plate} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <Button type="submit" variant="primary">Search</Button>
                                </form>

                                {foundCustomer && !sent && (
                                    <div className="p-6 bg-panel border-2 border-primary/20 rounded-xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex justify-between items-center border-b border-panel-border pb-4">
                                            <div>
                                                <h3 className="text-xl font-bold">{foundCustomer.year} {foundCustomer.make} {foundCustomer.model}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {isOwnerRegistered ? (
                                                        <span className="text-success text-xs font-bold flex items-center gap-1 uppercase tracking-wider bg-success/10 px-2 py-0.5 rounded border border-success/20">
                                                            <CheckCircle size={12} /> Connected Owner App Match
                                                        </span>
                                                    ) : (
                                                        <span className="text-foreground/50 text-xs font-bold flex items-center gap-1 uppercase tracking-wider bg-background px-2 py-0.5 rounded border border-panel-border">
                                                            Unregistered Offline Customer
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold opacity-80 block mb-2">
                                                    {foundCustomer.plate}
                                                </span>
                                                {!isEditingProfile && (
                                                    <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-foreground/50 border border-panel-border" onClick={() => setIsEditingProfile(!isEditingProfile)}>
                                                        Edit Profile
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {isEditingProfile && (
                                            <form onSubmit={handleUpdateProfile} className="bg-background p-4 rounded-xl border border-panel-border mb-6 space-y-4 animate-in slide-in-from-top-2">
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Edit Customer Details</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">Owner Name</label>
                                                        <Input value={newOwnerName} onChange={(e: any) => setNewOwnerName(e.target.value)} placeholder="Full Name" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">Phone</label>
                                                        <Input value={newPhone} onChange={(e: any) => setNewPhone(e.target.value)} placeholder="(555) 000-0000" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">Odometer</label>
                                                        <Input type="number" value={newOdo} onChange={(e: any) => setNewOdo(e.target.value)} placeholder="Current Mileage" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">Notes</label>
                                                        <Input value={newNotes} onChange={(e: any) => setNewNotes(e.target.value)} placeholder="Customer Notes" />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 justify-end">
                                                    <Button type="button" variant="ghost" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                                                    <Button type="submit" variant="primary">Save Customer Data</Button>
                                                </div>
                                            </form>
                                        )}

                                        <form onSubmit={(e) => handleSendBill(e)} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Service Line Items</label>
                                                <div className="space-y-3">
                                                    {items.map((item, i) => (
                                                        <div key={i} className="bg-background p-4 rounded-lg border border-panel-border space-y-3">
                                                            {/* Row 1: Item Name (always full width) */}
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">Item Name</label>
                                                                <Input
                                                                    required
                                                                    list="common-parts"
                                                                    placeholder="e.g. Engine Oil, Brake Pads"
                                                                    value={item.name}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, 'name', e.target.value)}
                                                                    className="w-full"
                                                                />
                                                            </div>
                                                            {/* Row 2: Qty, Life(km), Life(mo) — grid on all sizes */}
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">Qty</label>
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        placeholder="1"
                                                                        value={item.qty || 1}
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, 'qty', e.target.value ? parseInt(e.target.value, 10) : 1)}
                                                                        className="w-full font-mono text-sm"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">Life (km)</label>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="—"
                                                                        value={item.lifespanOdo || ""}
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, 'lifespanOdo', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                                                        className="w-full font-mono text-sm"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">Life (mo)</label>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="—"
                                                                        value={item.lifespanMonths || ""}
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, 'lifespanMonths', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                                                        className="w-full font-mono text-sm"
                                                                    />
                                                                </div>
                                                            </div>
                                                            {/* Row 3: Unit Price + Line Total + Delete */}
                                                            <div className="flex items-end gap-2 pt-2 border-t border-panel-border">
                                                                <div className="flex-1">
                                                                    <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">Unit Price (Rs)</label>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        placeholder="0.00"
                                                                        value={item.price || ""}
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, 'price', e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                                                        className="w-full font-mono"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 max-w-[120px]">
                                                                    <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">Total (Rs)</label>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        placeholder="0.00"
                                                                        value={item.price !== undefined ? Number(((item.price || 0) * (item.qty || 1)).toFixed(2)) || "" : ""}
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                            const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                                                            const qty = item.qty || 1;
                                                                            updateItem(i, 'price', val / qty);
                                                                        }}
                                                                        className="w-full font-mono bg-primary/5 border-primary/20"
                                                                    />
                                                                </div>
                                                                <Button type="button" variant="ghost" className="text-alert px-2 mb-0.5" onClick={() => removeItem(i)}>
                                                                    <Trash2 size={16} />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <Button type="button" variant="ghost" className="text-sm border border-dashed border-panel-border mt-2 w-full py-6" onClick={addItem}>
                                                        <Plus size={16} className="mr-2" /> Add Line Item
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-panel-border mb-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2">Service Odometer</label>
                                                        <Input
                                                            type="number"
                                                            placeholder="km at service"
                                                            value={serviceOdo}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServiceOdo(e.target.value)}
                                                            className="font-mono bg-background w-full"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2">Invoice Notes</label>
                                                        <Input
                                                            placeholder="Optional remarks..."
                                                            value={billNotes}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBillNotes(e.target.value)}
                                                            className="bg-background w-full"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2 text-primary">Service Cost (Rs)</label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            value={serviceCost || ""}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServiceCost(e.target.value ? parseFloat(e.target.value) : 0)}
                                                            className="font-mono bg-primary/10 border-primary/30 w-full text-primary"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-4 border-t border-panel-border">
                                                <span className="text-lg font-bold">Total Amount</span>
                                                <div className="text-right">
                                                    {serviceCost > 0 && <div className="text-sm font-mono text-primary mb-1 pl-2">Service Cost: +Rs {serviceCost.toFixed(2)}</div>}
                                                    <span className="text-2xl font-mono text-primary font-bold">Rs {grandTotal.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-1">
                                                <Button type="button" variant="ghost" size="sm" className="text-xs text-foreground/50 hover:bg-panel-border/30 h-8" onClick={() => {
                                                    const currentTotal = totalItemsAmount + serviceCost;
                                                    const remainder = currentTotal % 500;
                                                    if (remainder > 0 && currentTotal > 0) {
                                                        const roundAmount = 500 - remainder;
                                                        setItems([...items, { name: "Miscellaneous Items/Cost", price: roundAmount, qty: 1 }]);
                                                    }
                                                }}>
                                                    Round off to nearest 500/-
                                                </Button>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">Service Evidence (Photos)</label>
                                                <div className="flex items-center justify-center w-full">
                                                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-24 border-2 border-panel-border border-dashed rounded-xl cursor-pointer bg-panel hover:bg-panel-border/30 transition-colors">
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                            <p className="mb-2 text-sm text-foreground/70"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                            <p className="text-xs text-foreground/40">Any Image (MAX. 5MB. Will be base64 encoded)</p>
                                                        </div>
                                                        <input id="dropzone-file" type="file" className="hidden" multiple accept="image/*" onChange={handleBillPhotoChange} />
                                                    </label>
                                                </div>
                                                {billPhotos.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {billPhotos.map((photo, pIdx) => (
                                                            <div key={pIdx} className="w-12 h-12 bg-panel-border rounded overflow-hidden">
                                                                <img src={photo} alt="Upload Preview" className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex mt-4 pt-4 border-t border-panel-border">
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    className="w-full h-12 text-md"
                                                    disabled={isSubmitting}
                                                    onClick={(e: any) => {
                                                        const form = e.currentTarget.closest('form');
                                                        if (form && !form.reportValidity()) return;
                                                        handleSendBill(e);
                                                    }}
                                                >
                                                    {isSubmitting ? "Generating Invoice..." : "Create Invoice"}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {sent && foundCustomer && (
                                    <div className="p-8 flex flex-col items-center justify-center text-center bg-background border border-panel-border rounded-xl animate-in fade-in zoom-in shadow-sm">
                                        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                                            <CheckCircle size={32} className="text-success" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">Invoice Generated!</h3>
                                        <p className="text-foreground/70 mb-8 max-w-md">The invoice for <span className="font-mono font-bold">{foundCustomer.plate}</span> has been securely saved to the vehicle's history.</p>

                                        <div className="grid w-full sm:w-2/3 grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                            <Button variant="ghost" className="h-12 border border-panel-border hover:bg-panel" onClick={() => lastCompletedBill && handlePrint(lastCompletedBill)}>
                                                Print Invoice
                                            </Button>
                                            <Button
                                                variant="primary"
                                                className="h-12 bg-green-500 hover:bg-green-600 text-white border-0"
                                                onClick={() => {
                                                    if (lastCompletedBill) {
                                                        const phone = foundCustomer.phone || '';
                                                        window.open(generateWhatsAppLink(lastCompletedBill, phone), '_blank');
                                                    }
                                                }}
                                            >
                                                Share via WhatsApp
                                            </Button>
                                        </div>

                                        <Button variant="ghost" className="text-foreground/50 hover:text-foreground" onClick={() => { setSent(false); setFoundCustomer(null); setSearchPlate(""); setLastCompletedBill(null); }}>
                                            Create Another Invoice
                                        </Button>
                                    </div>
                                )}

                                {!foundCustomer && !sent && hasSearched && !showRegister && (
                                    <div className="h-48 flex flex-col items-center justify-center text-foreground/60 border-2 border-dashed border-panel-border rounded-xl space-y-4">
                                        <p>Vehicle <span className="font-mono font-bold text-foreground">{searchPlate.toUpperCase()}</span> not found in system.</p>
                                        <Button variant="ghost" className="border border-panel-border" onClick={() => setShowRegister(true)}>
                                            Register New Customer
                                        </Button>
                                    </div>
                                )}

                                {showRegister && (
                                    <div className="p-6 bg-panel border-2 border-primary/20 rounded-xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                        <div>
                                            <h3 className="text-xl font-bold">Register New Customer</h3>
                                            <p className="text-foreground/60">Enter basic details to create a profile for <span className="font-mono font-bold">{searchPlate.toUpperCase()}</span>.</p>
                                        </div>
                                        <form onSubmit={handleRegister} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Make</label>
                                                    <Input required placeholder="E.g. Honda" value={newMake} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMake(e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Model</label>
                                                    <Input required placeholder="E.g. Civic" value={newModel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewModel(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Year</label>
                                                    <Input required type="number" placeholder="YYYY" value={newYear} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewYear(e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Phone Number (Optional)</label>
                                                    <Input type="tel" placeholder="(555) 000-0000" value={newPhone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPhone(e.target.value)} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Owner Name (Optional)</label>
                                                <Input placeholder="Full Name" value={newOwnerName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewOwnerName(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                                                <Input placeholder="Customer preferences, etc." value={newNotes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNotes(e.target.value)} />
                                            </div>
                                            <div className="flex gap-2 pt-2 border-t border-panel-border">
                                                <Button type="button" variant="ghost" onClick={() => setShowRegister(false)}>Cancel</Button>
                                                <Button type="button" variant="primary" className="flex-1" onClick={(e: any) => {
                                                    const form = e.currentTarget.closest('form');
                                                    if (form && !form.reportValidity()) return;
                                                    handleRegister(e);
                                                }}>Save & Start Invoice</Button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </CardContent>
                        </Card >

                        <Card>
                            <CardHeader>
                                <CardTitle>{foundCustomer ? `Customer History` : `Recent Activity`}</CardTitle>
                                {foundCustomer && <CardDescription>Isolated to services requested at this garage.</CardDescription>}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {(() => {
                                    let displayBills = bills.filter(b => b.source === 'garage' && b.garageId === user?.id);
                                    if (foundCustomer) {
                                        displayBills = displayBills.filter(b => b.garageCustomerId === foundCustomer.id);
                                    }

                                    if (displayBills.length === 0) return <p className="text-sm text-foreground/50">No recent transactions.</p>;

                                    return displayBills.slice().reverse().map(bill => {
                                        const isExpanded = expandedBillId === bill.id;
                                        const isEditing = editingBillId === bill.id;
                                        return (
                                            <div key={bill.id} className="p-4 bg-background rounded-lg border border-panel-border transition-all">
                                                <div className="flex justify-between items-center mb-2 cursor-pointer" onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}>
                                                    <span className="text-xs text-foreground/50">{new Date(bill.date).toLocaleDateString()}</span>
                                                    {bill.status === 'pending' ? (
                                                        <span className="text-warning text-xs font-semibold">Wait</span>
                                                    ) : (
                                                        <span className="text-success text-xs font-semibold flex items-center gap-1">
                                                            <CheckCircle size={12} /> Done
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-1 cursor-pointer" onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}>
                                                    {bill.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between text-sm">
                                                            <span>{item.name}</span>
                                                            {isExpanded && <span className="text-foreground/70">Rs {item.price.toFixed(2)}</span>}
                                                        </div>
                                                    ))}
                                                </div>

                                                {isExpanded && !isEditing && (
                                                    <div className="mt-4 pt-3 border-t border-panel-border flex flex-col gap-3">
                                                        {bill.photos && bill.photos.length > 0 && (
                                                            <div>
                                                                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-2">Evidence / Photos</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {bill.photos.map((photo, pIdx) => (
                                                                        <div key={pIdx} className="w-16 h-16 rounded-md overflow-hidden border border-panel-border">
                                                                            <img src={photo} alt="Service Evidence" className="w-full h-full object-cover" />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <span className="block text-xs text-foreground/50">Plate: {bill.plate}</span>
                                                                {bill.odometer && <span className="block text-xs text-foreground/50">Odo: {bill.odometer} km</span>}
                                                            </div>
                                                            <div className="text-right">
                                                                {bill.discount && bill.discount < 0 ? (
                                                                    <div className="text-xs text-primary mb-1">Cost: +Rs {Math.abs(bill.discount).toFixed(2)}</div>
                                                                ) : bill.discount && bill.discount > 0 ? (
                                                                    <div className="text-xs text-success mb-1">Discount: -Rs {bill.discount.toFixed(2)}</div>
                                                                ) : null}
                                                                <span className="font-mono font-bold text-primary">Rs {bill.amount.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                        {/* Action Buttons */}
                                                        <div className="flex gap-2 pt-3 border-t border-panel-border">
                                                            <Button type="button" variant="ghost" className="flex-1 text-xs h-9 border border-panel-border" onClick={(e: any) => { e.stopPropagation(); startEditBill(bill); }}>Edit</Button>
                                                            <Button type="button" variant="ghost" className="flex-1 text-xs h-9 border border-panel-border" onClick={(e: any) => { e.stopPropagation(); handlePrint(bill); }}>Print</Button>
                                                            <Button type="button" variant="primary" className="flex-1 text-xs h-9 bg-green-500 hover:bg-green-600 text-white border-0" onClick={(e: any) => {
                                                                e.stopPropagation();
                                                                const phone = foundCustomer?.phone || '';
                                                                window.open(generateWhatsAppLink(bill, phone), '_blank');
                                                            }}>WhatsApp</Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {isEditing && (
                                                    <div className="mt-4 pt-3 border-t border-panel-border space-y-4 animate-in fade-in slide-in-from-top-2" onClick={(e: any) => e.stopPropagation()}>
                                                        <p className="text-xs font-bold text-primary uppercase tracking-wider">Editing Invoice</p>
                                                        <div className="space-y-3">
                                                            {editItems.map((item, i) => (
                                                                <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-panel/50 p-3 rounded-lg border border-panel-border">
                                                                    <Input required list="common-parts" placeholder="Item Name" value={item.name} onChange={(e: any) => updateEditItem(i, 'name', e.target.value)} className="flex-1 w-full" />
                                                                    <div className="flex gap-2 w-full sm:w-auto">
                                                                        <Input type="number" min="1" placeholder="Qty" value={item.qty || 1} onChange={(e: any) => updateEditItem(i, 'qty', e.target.value ? parseInt(e.target.value, 10) : 1)} className="w-full sm:w-16 font-mono text-sm" />
                                                                        <Input type="number" placeholder="Life(km)" value={item.lifespanOdo || ""} onChange={(e: any) => updateEditItem(i, 'lifespanOdo', e.target.value ? parseInt(e.target.value, 10) : undefined)} className="w-full sm:w-24 font-mono text-sm" />
                                                                        <Input type="number" placeholder="Life(mo)" value={item.lifespanMonths || ""} onChange={(e: any) => updateEditItem(i, 'lifespanMonths', e.target.value ? parseInt(e.target.value, 10) : undefined)} className="w-full sm:w-24 font-mono text-sm" />
                                                                    </div>
                                                                    <div className="flex items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">Unit (Rs)</span>
                                                                            <Input type="number" step="0.01" placeholder="0.00" value={item.price || ""} onChange={(e: any) => updateEditItem(i, 'price', e.target.value === "" ? 0 : parseFloat(e.target.value))} className="w-20 font-mono" />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">Total (Rs)</span>
                                                                            <Input type="number" step="0.01" placeholder="0.00" value={item.price !== undefined ? Number(((item.price || 0) * (item.qty || 1)).toFixed(2)) || "" : ""} onChange={(e: any) => {
                                                                                const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                                                                const qty = item.qty || 1;
                                                                                updateEditItem(i, 'price', val / qty);
                                                                            }} className="w-24 font-mono bg-primary/5 border-primary/20" />
                                                                        </div>
                                                                        <Button type="button" variant="ghost" className="text-alert px-2 mb-0.5" onClick={() => setEditItems(editItems.filter((_, idx) => idx !== i))}><Trash2 size={14} /></Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <Button type="button" variant="ghost" className="text-xs border border-dashed border-panel-border w-full py-4" onClick={() => setEditItems([...editItems, { name: '', price: 0, qty: 1 }])}>
                                                                <Plus size={14} className="mr-1" /> Add Item
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-medium mb-1">Odometer</label>
                                                                <Input type="number" placeholder="Mileage" value={editOdo} onChange={(e: any) => setEditOdo(e.target.value)} className="font-mono" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium mb-1">Notes</label>
                                                                <Input placeholder="Invoice notes..." value={editNotes} onChange={(e: any) => setEditNotes(e.target.value)} />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium mb-1 text-primary">Service Cost</label>
                                                                <Input type="number" step="0.01" placeholder="0.00" value={editServiceCost || ""} onChange={(e: any) => setEditServiceCost(e.target.value ? parseFloat(e.target.value) : 0)} className="font-mono text-primary border-primary/30" />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-bold">New Total: <span className="font-mono text-primary">Rs {editGrandTotal.toFixed(2)}</span></span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button type="button" variant="ghost" className="flex-1 border border-panel-border" onClick={cancelEditBill}>Cancel</Button>
                                                            <Button type="button" variant="primary" className="flex-1" disabled={isSavingEdit} onClick={() => handleSaveEditBill(bill.id)}>
                                                                {isSavingEdit ? "Saving..." : "Save Changes"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    });
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                )
                }

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

            {/* A4 Print Template (Hidden on screen, visible ONLY when printing) */}
            {printBill && (
                <div className="hidden print:block w-[210mm] min-h-[297mm] bg-white text-black mx-auto" style={{ padding: '15mm 18mm' }}>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-gray-300 pb-6 mb-6">
                        <div className="flex items-center gap-4">
                            <img src="/logo.png" alt="AutoLog Logo" className="h-12 w-auto object-contain" />
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">INVOICE</h1>
                                <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-widest">Service Record</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-lg font-bold text-gray-800">
                                {(user as any)?.user_metadata?.garage_name || "AutoLog Partner"}
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">Vehicle Service Center</p>
                            {user?.email && <p className="text-xs text-gray-500">{user.email}</p>}
                        </div>
                    </div>

                    {/* Customer & Service Details */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Customer Details</h3>
                            <p className="text-base font-bold font-mono text-gray-900">{printBill.plate || '—'}</p>
                            {foundCustomer && (
                                <>
                                    {(foundCustomer.make || foundCustomer.model) && (
                                        <p className="text-sm text-gray-600">{foundCustomer.make} {foundCustomer.model} {foundCustomer.year && `(${foundCustomer.year})`}</p>
                                    )}
                                    {foundCustomer.ownerName && <p className="text-sm text-gray-600 mt-1">{foundCustomer.ownerName}</p>}
                                    {foundCustomer.phone && <p className="text-xs text-gray-500 mt-1">Ph: {foundCustomer.phone}</p>}
                                </>
                            )}
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Service Details</h3>
                            <div className="grid grid-cols-2 gap-y-1.5 text-sm text-gray-600">
                                <span className="font-medium">Date:</span>
                                <span className="text-right text-gray-900">
                                    {new Date(printBill.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                {printBill.odometer && (
                                    <>
                                        <span className="font-medium">Odometer:</span>
                                        <span className="text-right font-mono text-gray-900">{printBill.odometer} km</span>
                                    </>
                                )}
                                <span className="font-medium">Status:</span>
                                <span className="text-right text-gray-900">
                                    {printBill.status === 'pending' ? 'Pending Approval' : 'Approved'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-left border-collapse mb-6">
                        <thead>
                            <tr className="border-b-2 border-gray-900">
                                <th className="py-2 px-2 font-bold text-xs uppercase tracking-wider text-gray-900">Description</th>
                                <th className="py-2 px-2 font-bold text-xs uppercase tracking-wider text-center w-20 text-gray-900">Life</th>
                                <th className="py-2 px-2 font-bold text-xs uppercase tracking-wider text-right w-14 text-gray-900">Qty</th>
                                <th className="py-2 px-2 font-bold text-xs uppercase tracking-wider text-right w-28 text-gray-900">Unit Price</th>
                                <th className="py-2 px-2 font-bold text-xs uppercase tracking-wider text-right w-28 text-gray-900">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {(printBill.items || []).map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-200">
                                    <td className="py-3 px-2 font-medium text-sm">{item.name}</td>
                                    <td className="py-3 px-2 text-center text-xs text-gray-400">
                                        {item.lifespanOdo ? `${item.lifespanOdo}km` : ''}
                                        {item.lifespanOdo && item.lifespanMonths ? ' / ' : ''}
                                        {item.lifespanMonths ? `${item.lifespanMonths}mo` : ''}
                                        {(!item.lifespanOdo && !item.lifespanMonths) && '—'}
                                    </td>
                                    <td className="py-3 px-2 text-right font-mono text-sm">{item.qty || 1}</td>
                                    <td className="py-3 px-2 text-right font-mono text-sm">Rs {item.price.toFixed(2)}</td>
                                    <td className="py-3 px-2 text-right font-mono text-sm font-semibold text-gray-900">
                                        Rs {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end mb-8">
                        <div className="w-72">
                            {(() => {
                                const items = printBill.items || [];
                                const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0);
                                const discount = printBill.discount || 0;
                                const total = printBill.amount || (subtotal - discount);
                                return (
                                    <>
                                        <div className="flex justify-between py-1.5 text-sm text-gray-600">
                                            <span>Subtotal</span>
                                            <span className="font-mono">Rs {subtotal.toFixed(2)}</span>
                                        </div>
                                        {discount < 0 && (
                                            <div className="flex justify-between py-1.5 text-sm font-semibold text-gray-900 border-t border-gray-200">
                                                <span>Service Cost</span>
                                                <span className="font-mono">+Rs {Math.abs(discount).toFixed(2)}</span>
                                            </div>
                                        )}
                                        {discount > 0 && (
                                            <div className="flex justify-between py-1.5 text-sm text-green-700 border-t border-gray-200">
                                                <span>Discount</span>
                                                <span className="font-mono">-Rs {discount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between py-3 mt-1 border-t-2 border-gray-900">
                                            <span className="font-bold text-gray-900">Total Due</span>
                                            <span className="font-bold font-mono text-lg text-gray-900">Rs {total.toFixed(2)}</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Notes */}
                    {printBill.notes && (
                        <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-gray-400 block mb-1">Mechanic Notes</span>
                            {printBill.notes}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-auto text-center text-xs text-gray-400 pt-6 border-t border-gray-200">
                        <p className="font-medium text-gray-700 mb-0.5">Thank you for your business!</p>
                        <p>All service records are securely synced to your AutoLog Connect profile.</p>
                    </div>
                </div>
            )}
        </>
    );
}
