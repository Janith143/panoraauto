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
        const user = jwt.verify(token, JWT_SECRET) as any;

        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const role = url.searchParams.get('role');

        if (user.id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Fallback type for bills
        let bills: any[] = [];

        if (role === 'owner') {
            const vehicles = await prisma.vehicle.findMany({
                where: { ownerId: userId || undefined },
                select: { id: true }
            });
            const vehicleIds = vehicles.map(v => v.id);

            if (vehicleIds.length > 0) {
                bills = await prisma.bill.findMany({
                    where: { vehicleId: { in: vehicleIds } },
                    include: { items: true },
                    orderBy: { date: 'desc' }
                });
            }
        } else if (role === 'garage') {
            bills = await prisma.bill.findMany({
                where: { garageId: userId || undefined },
                include: { items: true },
                orderBy: { date: 'desc' }
            });
        }

        return NextResponse.json(bills);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
