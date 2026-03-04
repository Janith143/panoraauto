"use client";

import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/app/components/ui";
import { UserSettingsModal } from "@/app/components/ui/UserSettingsModal";
import { NotificationDropdown } from "@/app/components/ui/NotificationDropdown";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout } = useAuth();
    const [pushBlocked, setPushBlocked] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const registerPush = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
            });
            await fetch('/api/web-push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription, userId: user?.id })
            });
        } catch (e) {
            console.error("Push setup failed", e);
        }
    };

    const handleEnablePush = async () => {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setPushBlocked(false);
            await registerPush();
        } else {
            alert("Please enable notifications directly in your browser or device settings, as permission was denied.");
            setPushBlocked(false);
        }
    };

    useEffect(() => {
        if (!user || user.role !== 'owner') return;

        async function checkPushState() {
            if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
                if (Notification.permission === 'default') {
                    setPushBlocked(true);
                } else if (Notification.permission === 'granted') {
                    await registerPush();
                }
            }
        }
        checkPushState();
    }, [user]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <nav className="border-b border-panel-border bg-panel px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <img src="/logo.png" alt="Panora Auto Logo" className="h-14 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity" />
                    </Link>
                    {user && (
                        <span className="text-sm px-2 py-1 bg-panel-border rounded-md text-foreground/80">
                            {user.role}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {user?.role === 'owner' && <NotificationDropdown />}
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="text-sm font-medium hidden sm:inline-block hover:text-primary transition-colors hover:underline"
                        title="Open Profile Settings"
                    >
                        {user?.name}
                    </button>
                    <Button variant="ghost" size="icon" onClick={logout} title="Log Out">
                        <LogOut size={20} />
                    </Button>
                </div>
            </nav>

            <main className="p-6 max-w-7xl mx-auto w-full flex-grow relative">
                {pushBlocked && user?.role === 'owner' && (
                    <div className="mb-4 bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-sm shadow-sm animate-in fade-in slide-in-from-top-2">
                        <span>
                            <strong>Stay Updated!</strong> Enable push notifications to receive maintenance reminders and expiry alerts.
                        </span>
                        <div className="flex gap-2 shrink-0">
                            <button onClick={handleEnablePush} className="bg-primary text-white font-semibold text-xs px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                                Enable Alerts
                            </button>
                            <button onClick={() => setPushBlocked(false)} className="text-primary hover:bg-primary/10 transition-colors font-semibold text-xs uppercase px-3 py-2 rounded-lg border border-transparent">
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}
                {children}
            </main>

            <footer className="border-t border-panel-border bg-panel px-6 py-6 mt-8 shrink-0">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-foreground/60">
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <img src="/logo.png" alt="Panora Auto Logo" className="h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
                        </Link>
                        <span className="font-medium text-base">&copy; {new Date().getFullYear()} Panora Auto. All rights reserved.</span>
                    </div>
                </div>
            </footer>

            {showSettingsModal && (
                <UserSettingsModal onClose={() => setShowSettingsModal(false)} />
            )}
        </div>
    );
}
