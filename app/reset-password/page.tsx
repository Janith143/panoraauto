"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from "@/app/components/ui";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <AlertTriangle size={48} className="text-alert mx-auto" />
                            <h2 className="text-xl font-bold">Invalid Reset Link</h2>
                            <p className="text-foreground/60 text-sm">This password reset link is invalid or has expired. Please request a new one.</p>
                            <Link href="/login">
                                <Button variant="primary" className="mt-4">Back to Login</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <CheckCircle size={48} className="text-success mx-auto" />
                            <h2 className="text-xl font-bold">Password Reset Successfully!</h2>
                            <p className="text-foreground/60 text-sm">Your password has been updated. You can now sign in with your new password.</p>
                            <Link href="/login">
                                <Button variant="primary" className="mt-4">Sign In</Button>
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
                <h1 className="text-3xl font-extrabold text-primary mb-1">Set New Password</h1>
                <p className="text-foreground/60 text-sm">Enter your new password below.</p>
            </div>

            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="p-3 bg-alert/10 border border-alert/30 text-alert text-sm rounded">{error}</div>}

                        <div>
                            <label className="block text-sm font-medium mb-1">New Password</label>
                            <Input
                                required
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e: any) => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                            <Input
                                required
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e: any) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                            {loading && <Loader2 className="mr-2 animate-spin" size={20} />}
                            Reset Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin" size={32} /></div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
