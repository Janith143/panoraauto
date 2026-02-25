import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { X } from 'lucide-react';

interface UserSettingsModalProps {
    onClose: () => void;
}

export function UserSettingsModal({ onClose }: UserSettingsModalProps) {
    const { user, login } = useAuth();
    const [notificationEmail, setNotificationEmail] = useState(user?.notificationEmail || '');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const res = await fetch('/api/auth/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationEmail })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update settings');
            }

            login(data.user); // Update context with new email
            setSuccessMessage('Settings updated successfully');
            setTimeout(() => onClose(), 1500);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-panel w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-panel-border">
                    <h2 className="text-xl font-semibold">Profile Settings</h2>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>}
                    {successMessage && <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">{successMessage}</div>}

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">
                            Registered Account Email (Cannot be changed via UI)
                        </label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white opacity-50 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">
                            Notification & Transfer Email
                        </label>
                        <p className="text-xs text-neutral-500 mb-2">
                            Set a different email address to receive maintenance alerts or coordinate vehicle transfers. Leave formatting blank to default to your account email.
                        </p>
                        <input
                            type="email"
                            value={notificationEmail}
                            onChange={(e) => setNotificationEmail(e.target.value)}
                            placeholder={user.email}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-4 py-2 text-white placeholder-neutral-600 outline-none transition-all"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
