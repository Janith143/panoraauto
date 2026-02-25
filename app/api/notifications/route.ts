import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(req: Request) {
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

        const notifications = await prisma.notification.findMany({
            where: { userId: decoded.id },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to 50 most recent
        });

        return NextResponse.json({ notifications });
    } catch (err: any) {
        console.error('Fetch notifications error:', err);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}
