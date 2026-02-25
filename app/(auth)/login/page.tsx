"use client";

import { useAuth, UserRole } from "@/app/context/AuthContext";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from "@/app/components/ui";
import { Car, Wrench, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState<UserRole>("owner");
    const [authLoading, setAuthLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'garage') router.push('/garage');
            else router.push('/owner');
        }
    }, [user, loading, router]);

    if (loading) return null;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            if (isLogin) {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, role })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Invalid credentials');
                }

                // Allow API to drop cookie and session
            } else {
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, role, name })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || 'Failed to sign up');
                }

                setSuccessMsg("Account created! You are now logging in...");

                // Allow a brief moment for the user to see the success message before router redirect handles the rest via cookie
            }

            // Re-fetch the user profile globally so context updates and redirects
            window.location.reload();

        } catch (err: any) {
            setErrorMsg(err.message || 'Authentication error');
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8 flex flex-col items-center">
                <img src="/logo.png" alt="Panora Auto" className="h-24 w-auto object-contain mb-4" />
                <h1 className="text-5xl font-extrabold text-primary mb-2">Panora Auto</h1>
                <p className="text-lg text-foreground/70 font-medium">Connect with your digital garage</p>
            </div>

            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>{isLogin ? "Sign In" : "Create Account"}</CardTitle>
                    <CardDescription>
                        {isLogin ? "Enter your email and password to access your dashboard." : "Sign up as an Owner or Garage Admin."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAuth} className="space-y-4">
                        {errorMsg && <div className="p-3 bg-alert/10 border border-alert/30 text-alert text-sm rounded">{errorMsg}</div>}
                        {successMsg && <div className="p-3 bg-success/10 border border-success/30 text-success text-sm rounded">{successMsg}</div>}

                        {!isLogin && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1">I am a...</label>
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
                                    <label className="block text-sm font-medium mb-1">{role === 'garage' ? "Garage Name" : "Full Name"}</label>
                                    <Input
                                        required
                                        type="text"
                                        placeholder={role === 'garage' ? "Metro Auto Garage" : "Alex Driver"}
                                        value={name}
                                        onChange={(e: any) => setName(e.target.value)}
                                    />
                                    {role === 'garage' && (
                                        <p className="text-xs text-primary mt-2 font-medium bg-primary/10 p-2 rounded border border-primary/20">
                                            100% free for 1st year, try now. If you like to continue after 1 year, <a href="https://panoralink.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary/80">contact support team</a>.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
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
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <Input
                                required
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e: any) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 text-lg" disabled={authLoading}>
                            {authLoading && <Loader2 className="mr-2 animate-spin" size={20} />}
                            {isLogin ? "Sign In" : "Sign Up"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-foreground/70">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                        </span>{" "}
                        <button
                            type="button"
                            onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); setSuccessMsg(""); }}
                            className="text-primary hover:underline font-bold"
                        >
                            {isLogin ? "Sign up" : "Sign in"}
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-panel-border">
                        <p className="text-xs text-center text-foreground/50 mb-4 uppercase tracking-widest font-bold">Demo Profiles</p>
                        <div className="space-y-2">
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-xs justify-start border border-panel-border bg-panel/50 hover:bg-panel"
                                onClick={() => { setEmail("udara@example.com"); setPassword("password123"); setIsLogin(true); }}
                            >
                                <Car size={14} className="mr-2 text-primary" /> Owner: Udara Wijesundara
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-xs justify-start border border-panel-border bg-panel/50 hover:bg-panel"
                                onClick={() => { setEmail("madduma@example.com"); setPassword("password123"); setIsLogin(true); }}
                            >
                                <Wrench size={14} className="mr-2 text-primary" /> Garage: Madduma Repairs
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
