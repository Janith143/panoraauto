import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev_123';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(request.url);
        const ownerId = url.searchParams.get('ownerId');

        // Find vehicles for owner
        const vehicles = await prisma.vehicle.findMany({ where: { ownerId: ownerId || undefined }, select: { id: true } });
        const vehicleIds = vehicles.map(v => v.id);

        if (vehicleIds.length === 0) return NextResponse.json([]);

        const parts = await prisma.vehiclePart.findMany({
            where: { vehicleId: { in: vehicleIds } }
        });

        return NextResponse.json(parts);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
