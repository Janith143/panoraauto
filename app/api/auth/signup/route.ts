import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev_123';

export async function POST(request: Request) {
    try {
        const { email, password, role, name } = await request.json();

        if (!email || !password || !role || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let user;

        if (role === 'garage') {
            const existing = await prisma.garage.findUnique({ where: { ownerEmail: email } });
            if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });

            user = await prisma.garage.create({
                data: { ownerEmail: email, password: hashedPassword, name, role }
            });
        } else {
            const existing = await prisma.owner.findUnique({ where: { email } });
            if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });

            user = await prisma.owner.create({
                data: { email, password: hashedPassword, fullName: name, role }
            });
        }

        const token = jwt.sign(
            { id: user.id, email: role === 'garage' ? (user as any).ownerEmail : (user as any).email, role, name: role === 'garage' ? (user as any).name : (user as any).fullName },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        const response = NextResponse.json({ user: { id: user.id, email, role, name } }, { status: 200 });
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60
        });

        return response;

    } catch (error: any) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: error.message || 'Error occurred during signup' }, { status: 500 });
    }
}
