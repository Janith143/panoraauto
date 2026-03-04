"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/app/components/ui';
import Link from 'next/link';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email address...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const res = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage('Your email has been successfully verified! You can now log in.');
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('An error occurred. Please try again later.');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-panel-border">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                        <h2 className="text-2xl font-bold mb-2">Verifying...</h2>
                        <p className="text-foreground/60">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <CheckCircle className="w-16 h-16 text-success mb-6" />
                        <h2 className="text-2xl font-bold mb-2">Email Verified</h2>
                        <p className="text-foreground/60 mb-8">{message}</p>
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => window.location.replace('/')}
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <XCircle className="w-16 h-16 text-alert mb-6" />
                        <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
                        <p className="text-foreground/60 mb-8">{message}</p>
                        <Link href="/login" className="w-full">
                            <Button variant="ghost" className="w-full border-2 border-panel-border hover:bg-panel">
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
