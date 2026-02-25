import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(req: Request) {
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

        const { vehicleId, newOwnerEmail } = await req.json();

        if (!vehicleId || !newOwnerEmail) {
            return NextResponse.json({ error: 'Missing vehicle ID or new owner email' }, { status: 400 });
        }

        // 1. Verify the vehicle belongs to the current user
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId }
        });

        if (!vehicle) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        if (vehicle.ownerId !== decoded.id) {
            return NextResponse.json({ error: 'You do not own this vehicle' }, { status: 403 });
        }

        // 2. Find the new owner by their account email or their notification email
        const newOwner = await prisma.owner.findFirst({
            where: {
                OR: [
                    { email: newOwnerEmail },
                    { notificationEmail: newOwnerEmail }
                ]
            }
        });

        if (!newOwner) {
            return NextResponse.json({ error: 'No registered user found with that email address. The new owner must create an account first.' }, { status: 404 });
        }

        // 3. Prevent transferring to self
        if (newOwner.id === decoded.id) {
            return NextResponse.json({ error: 'You cannot transfer a vehicle to yourself' }, { status: 400 });
        }

        // 4. Execute the transfer via Prisma Update
        await prisma.vehicle.update({
            where: { id: vehicleId },
            data: { ownerId: newOwner.id }
        });

        return NextResponse.json({ success: true, message: 'Vehicle transferred successfully' });

    } catch (err: any) {
        console.error('Vehicle transfer error:', err);
        return NextResponse.json({ error: 'Failed to transfer vehicle' }, { status: 500 });
    }
}
