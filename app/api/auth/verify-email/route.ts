import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev_123';

export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
        }

        // Try to find the token in owners
        let owner = await prisma.owner.findUnique({ where: { verificationToken: token } as any });

        if (owner) {
            await prisma.owner.update({
                where: { id: owner.id },
                data: { isEmailVerified: true, verificationToken: null } as any
            });

            const jwtToken = jwt.sign(
                { id: owner.id, email: owner.email, role: owner.role, name: owner.fullName, notificationEmail: owner.notificationEmail },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            const response = NextResponse.json({ message: 'Email verified successfully.' }, { status: 200 });
            response.cookies.set('auth_token', jwtToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60
            });

            return response;
        }

        // Try to find the token in garages
        let garage = await prisma.garage.findUnique({ where: { verificationToken: token } as any });

        if (garage) {
            await prisma.garage.update({
                where: { id: garage.id },
                data: { isEmailVerified: true, verificationToken: null } as any
            });

            const jwtToken = jwt.sign(
                { id: garage.id, email: garage.ownerEmail, role: garage.role, name: garage.name },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            const response = NextResponse.json({ message: 'Email verified successfully.' }, { status: 200 });
            response.cookies.set('auth_token', jwtToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60
            });

            return response;
        }

        return NextResponse.json({ error: 'Invalid or expired verification token.' }, { status: 400 });

    } catch (error: any) {
        console.error('Verification error:', error);
        return NextResponse.json({ error: 'An error occurred during verification' }, { status: 500 });
    }
}
