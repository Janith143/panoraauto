"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export type UserRole = "owner" | "driver" | "garage" | null;

interface User {
    id: string;
    email: string;
    role: UserRole;
    name: string;
}

interface AuthContextType {
    user: User | null;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const syncProfile = async (u: any) => {
            const role = u.user_metadata?.role || "owner";
            const name = u.user_metadata?.full_name || u.email!.split("@")[0];

            try {
                if (role === 'garage') {
                    const { data } = await supabase.from('garages').select('id').eq('id', u.id).maybeSingle();
                    if (!data) {
                        await supabase.from('garages').insert({ id: u.id, owner_email: u.email, name });
                    }
                } else {
                    const { data } = await supabase.from('owners').select('id').eq('id', u.id).maybeSingle();
                    if (!data) {
                        await supabase.from('owners').insert({ id: u.id, email: u.email, full_name: name });
                    }
                }
            } catch (err) {
                console.error("Profile sync error:", err);
            }

            return { id: u.id, email: u.email!, role, name };
        };

        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Session error (likely invalid refresh token):", error);
                    // Force sign out to clear invalid local tokens
                    await supabase.auth.signOut();
                } else if (session?.user) {
                    const userProfile = await syncProfile(session.user);
                    setUser(userProfile);
                }
            } catch (err) {
                console.error("Auth init exception:", err);
                await supabase.auth.signOut();
            }
            setLoading(false);

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                if (session?.user) {
                    const userProfile = await syncProfile(session.user);
                    setUser(userProfile);
                } else {
                    setUser(null);
                }
            });

            return () => subscription.unsubscribe();
        };

        initializeAuth();
    }, []);

    const logout = async () => {
        try {
            // Forcefully clear auth tokens from local storage to prevent getting stuck
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('sb-') && key?.endsWith('-auth-token')) {
                    localStorage.removeItem(key);
                }
            }
            // Fire signout asynchronously but don't wait for it to succeed if the network/token is bad
            supabase.auth.signOut().catch(console.error);
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            window.location.href = "/login";
        }
    };

    return (
        <AuthContext.Provider value={{ user, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
