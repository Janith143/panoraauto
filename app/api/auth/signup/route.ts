import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

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

        const verificationToken = crypto.randomBytes(32).toString('hex');

        if (role === 'garage') {
            const existing = await prisma.garage.findUnique({ where: { ownerEmail: email } });
            if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });

            user = await prisma.garage.create({
                data: { ownerEmail: email, password: hashedPassword, name, role, verificationToken }
            });
        } else {
            const existing = await prisma.owner.findUnique({ where: { email } });
            if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });

            user = await prisma.owner.create({
                data: { email, password: hashedPassword, fullName: name, role, verificationToken }
            });
        }

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        return NextResponse.json({
            message: 'Registration successful. Please check your email to verify your account before logging in.'
        }, { status: 201 });

    } catch (error: any) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: error.message || 'Error occurred during signup' }, { status: 500 });
    }
}
