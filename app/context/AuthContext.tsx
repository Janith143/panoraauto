"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "owner" | "driver" | "garage" | null;

interface User {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    notificationEmail?: string;
}

interface AuthContextType {
    user: User | null;
    logout: () => void;
    loading: boolean;
    login: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Check if user session exists in API route
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setUser(data.user);
                    }
                }
            } catch (err) {
                console.error("Auth init exception:", err);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
    }

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, logout, loading, login }}>
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
