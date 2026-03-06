"use client";

import { useState } from "react";
import { Card, CardContent, Button, Input } from "@/app/components/ui";
import { Loader2, CheckCircle, ArrowLeft, Car, Wrench } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/app/context/AuthContext";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<UserRole>("owner");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, role }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSent(true);
        } catch (err: any) {
            setError(err.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <CheckCircle size={48} className="text-success mx-auto" />
                            <h2 className="text-xl font-bold">Check Your Email</h2>
                            <p className="text-foreground/60 text-sm">If an account exists with <strong>{email}</strong>, we&apos;ve sent a password reset link. Please check your inbox (and spam folder).</p>
                            <Link href="/login">
                                <Button variant="ghost" className="mt-4 border border-panel-border">
                                    <ArrowLeft size={16} className="mr-2" /> Back to Login
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8">
                <img src="/logo.png" alt="Panora Auto" className="h-16 w-auto object-contain mx-auto mb-4" />
                <h1 className="text-3xl font-extrabold text-primary mb-1">Forgot Password</h1>
                <p className="text-foreground/60 text-sm">Enter your email to receive a reset link.</p>
            </div>

            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="p-3 bg-alert/10 border border-alert/30 text-alert text-sm rounded">{error}</div>}

                        <div>
                            <label className="block text-sm font-medium mb-1">Account Type</label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={role === 'owner' ? "primary" : "ghost"}
                                    className={`flex-1 ${role !== 'owner' ? 'border border-panel-border' : ''}`}
                                    onClick={() => setRole('owner')}
                                >
                                    <Car size={16} className="mr-2" /> Owner
                                </Button>
                                <Button
                                    type="button"
                                    variant={role === 'garage' ? "primary" : "ghost"}
                                    className={`flex-1 ${role !== 'garage' ? 'border border-panel-border' : ''}`}
                                    onClick={() => setRole('garage')}
                                >
                                    <Wrench size={16} className="mr-2" /> Garage
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <Input
                                required
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                            {loading && <Loader2 className="mr-2 animate-spin" size={20} />}
                            Send Reset Link
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-primary hover:underline text-sm font-bold">
                            <ArrowLeft size={14} className="inline mr-1" /> Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
