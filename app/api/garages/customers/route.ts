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
        const garageId = url.searchParams.get('garageId');

        if (user.role !== 'garage' || user.id !== garageId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const customers = await prisma.garageCustomer.findMany({
            where: { garageId: garageId || undefined }
        });

        return NextResponse.json(customers);
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

        const body = await request.json();

        // Simple garage ID check via token
        if (user.role !== 'garage') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const newCustomer = await prisma.garageCustomer.create({
            data: {
                garageId: user.id,
                make: body.make,
                model: body.model,
                year: body.year,
                plate: body.plate.toUpperCase(),
                phone: body.phone || undefined,
                ownerName: body.ownerName || undefined,
                notes: body.notes || undefined,
                odometer: body.odometer || undefined
            }
        });

        return NextResponse.json(newCustomer);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
