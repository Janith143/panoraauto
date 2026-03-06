import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Try owners first
        const owner = await prisma.owner.findUnique({ where: { verificationToken: token } as any });
        if (owner) {
            await prisma.owner.update({
                where: { id: owner.id },
                data: {
                    password: hashedPassword,
                    verificationToken: null
                } as any
            });
            return NextResponse.json({ message: 'Password has been reset successfully. You can now sign in.' });
        }

        // Try garages
        const garage = await prisma.garage.findUnique({ where: { verificationToken: token } as any });
        if (garage) {
            await prisma.garage.update({
                where: { id: garage.id },
                data: {
                    password: hashedPassword,
                    verificationToken: null
                } as any
            });
            return NextResponse.json({ message: 'Password has been reset successfully. You can now sign in.' });
        }

        return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });

    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}
