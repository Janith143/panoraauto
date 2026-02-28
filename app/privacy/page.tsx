"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/ui";

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8 flex flex-col items-center">
                <img src="/logo.png" alt="Panora Auto" className="h-24 w-auto object-contain mb-4" />
                <h1 className="text-4xl font-extrabold text-primary mb-2">Panora Auto</h1>
            </div>

            <Card className="w-full max-w-2xl shadow-lg border-primary/10">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                        <ShieldCheck size={40} className="text-primary" />
                    </div>
                    <CardTitle className="text-3xl border-b border-border pb-4">Privacy Policy</CardTitle>
                    <CardDescription className="pt-2 text-md">
                        Your privacy is our top priority.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4 text-foreground/80 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-2">1. Introduction</h2>
                        <p>
                            Welcome to Panora Auto. We are committed to protecting your personal information and your right to privacy.
                            If you have any questions or concerns about this privacy notice or our practices with regards to your personal information, please contact us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-2">2. Data Security & Usage</h2>
                        <p className="font-semibold text-foreground/90 bg-alert/5 p-4 rounded-lg border border-alert/20">
                            We do not share your data with any third parties, nor do we use it for anything other than providing the core functionality of the Panora Auto platform. Everything you enter remains completely private and secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-2">3. Information We Collect</h2>
                        <p>
                            We collect personal information that you voluntarily provide to us when you register on the platform, express an interest in obtaining information about us or our products and services, or otherwise when you contact us. This includes basic account details such as your name, email address, and optionally, your vehicle or garage information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-2">4. How We Use Your Information</h2>
                        <p>
                            We use personal information collected via our platform purely for business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations. The data is solely utilized to operate and maintain the application correctly.
                        </p>
                    </section>

                    <div className="pt-6 text-center border-t border-border mt-8">
                        <Link href="/login">
                            <Button variant="ghost" className="mt-4 border border-input hover:bg-accent hover:text-accent-foreground">
                                Return to Login
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
