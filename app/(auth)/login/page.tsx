"use client";

import { useAuth, UserRole } from "@/app/context/AuthContext";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from "@/app/components/ui";
import { Car, Wrench, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                            role
                        }
                    }
                });
                if (error) throw error;

                if (data.user) {
                    try {
                        if (role === 'garage') {
                            const { error: gErr } = await supabase.from('garages').insert({
                                id: data.user.id,
                                owner_email: email,
                                name: name
                            });
                            if (gErr) throw new Error(`Failed creating garage profile: ${gErr.message}`);
                        } else {
                            const { error: oErr } = await supabase.from('owners').insert({
                                id: data.user.id,
                                email: email,
                                full_name: name
                            });
                            if (oErr) throw new Error(`Failed creating owner profile: ${oErr.message}`);
                        }
                        setSuccessMsg("Account created! You can now log in.");
                        setIsLogin(true);
                    } catch (insertErr: any) {
                        setErrorMsg(insertErr.message);
                    }
                }
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Authentication error');
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-primary mb-2">AutoLog</h1>
                <p className="text-foreground/70">Connect with your digital garage</p>
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
