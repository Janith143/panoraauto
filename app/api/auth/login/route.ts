import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev_123';

export async function POST(request: Request) {
    try {
        const { email, password, role } = await request.json();

        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Missing credentials or role' }, { status: 400 });
        }

        let user;
        if (role === 'garage') {
            user = await prisma.garage.findUnique({ where: { ownerEmail: email } });
        } else {
            user = await prisma.owner.findUnique({ where: { email } });
        }

        if (!user || !user.password) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        if (!user.isEmailVerified) {
            return NextResponse.json({ error: 'Please verify your email address before logging in.' }, { status: 403 });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const userName = role === 'garage' ? (user as any).name : (user as any).fullName;
        const userEmail = role === 'garage' ? (user as any).ownerEmail : (user as any).email;
        const notificationEmail = role === 'garage' ? undefined : (user as any).notificationEmail;

        const token = jwt.sign(
            { id: user.id, email: userEmail, role, name: userName, notificationEmail },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        const response = NextResponse.json({ user: { id: user.id, email: userEmail, role, name: userName, notificationEmail } }, { status: 200 });

        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60
        });

        return response;

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: error.message || 'Error occurred during login' }, { status: 500 });
    }
}
