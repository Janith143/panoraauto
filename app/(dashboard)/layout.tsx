"use client";

import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/app/components/ui";
import { LogOut } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-background">
            <nav className="border-b border-panel-border bg-panel px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-primary">AutoLog</h1>
                    {user && (
                        <span className="text-sm px-2 py-1 bg-panel-border rounded-md text-foreground/80">
                            {user.role}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium hidden sm:inline-block">
                        {user?.name}
                    </span>
                    <Button variant="ghost" size="icon" onClick={logout} title="Log Out">
                        <LogOut size={20} />
                    </Button>
                </div>
            </nav>

            <main className="p-6 max-w-7xl mx-auto">
                {children}
            </main>
        </div>
    );
}
