import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { email, role } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const resetToken = randomUUID();

        if (role === 'garage') {
            const garage = await prisma.garage.findUnique({ where: { ownerEmail: email } });
            if (garage) {
                await prisma.garage.update({
                    where: { id: garage.id },
                    data: { verificationToken: resetToken } as any
                });
                await sendPasswordResetEmail(email, resetToken);
            }
        } else {
            const owner = await prisma.owner.findUnique({ where: { email } });
            if (owner) {
                await prisma.owner.update({
                    where: { id: owner.id },
                    data: { verificationToken: resetToken } as any
                });
                await sendPasswordResetEmail(email, resetToken);
            }
        }

        // Always return success to prevent email enumeration
        return NextResponse.json({ message: 'If an account exists with that email, a password reset link has been sent.' });

    } catch (error: any) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}
