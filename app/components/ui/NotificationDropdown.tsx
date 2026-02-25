import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    createdAt: string;
}

export function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && notifications.length === 0) {
            fetchNotifications();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error("Failed to fetch notification history", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-panel-border rounded-full text-neutral-400 hover:text-white transition-colors relative"
            >
                <Bell size={20} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-panel border mx-2 border-panel-border rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-panel-border sticky top-0 bg-panel/95 backdrop-blur z-10">
                        <h3 className="font-semibold text-sm">Notification History</h3>
                    </div>

                    <div className="divide-y divide-panel-border/50">
                        {loading ? (
                            <div className="p-6 text-center text-neutral-500 text-sm">Loading history...</div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <div key={notif.id} className="p-4 hover:bg-neutral-800/30 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-medium text-sm text-neutral-200">{notif.title}</h4>
                                        <span className="text-[10px] text-neutral-500 shrink-0 ml-2">
                                            {new Date(notif.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-400 leading-relaxed">
                                        {notif.message}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-neutral-500 text-sm">
                                <Bell className="mx-auto mb-2 opacity-20" size={24} />
                                No notifications yet
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
