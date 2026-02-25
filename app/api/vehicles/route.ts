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
        const ownerId = url.searchParams.get('ownerId');

        if (user.role !== 'owner' || user.id !== ownerId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const vehicles = await prisma.vehicle.findMany({
            where: { ownerId: ownerId || undefined }
        });

        return NextResponse.json(vehicles);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const user = jwt.verify(token, JWT_SECRET) as any;

        const { make, model, year, plate, currentOdo } = await request.json();

        // Ensure owner exists in DB (creates just-in-time if not)
        const owner = await prisma.owner.findUnique({ where: { id: user.id } });
        if (!owner) {
            await prisma.owner.create({
                data: { id: user.id, email: user.email, fullName: user.name, role: user.role }
            });
        }

        const newVehicle = await prisma.vehicle.create({
            data: {
                ownerId: user.id,
                make,
                model,
                year,
                plate: plate.toUpperCase(),
                currentOdo
            }
        });

        return NextResponse.json(newVehicle);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
