import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function PATCH(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;

        if (decoded.role !== 'owner') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { notificationEmail } = await req.json();

        // Validate basic email format if provided
        if (notificationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        const updatedOwner = await prisma.owner.update({
            where: { id: decoded.id },
            data: { notificationEmail: notificationEmail || null }
        });

        return NextResponse.json({
            success: true,
            user: {
                id: updatedOwner.id,
                email: updatedOwner.email,
                notificationEmail: updatedOwner.notificationEmail,
                name: updatedOwner.fullName,
                role: updatedOwner.role
            }
        });
    } catch (err: any) {
        console.error('Update settings error:', err);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
