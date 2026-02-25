import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev_123';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        // Handle nested items update directly by deleting old ones and re-inserting
        // if items array is provided in body
        let itemsUpdate = {};

        if (body.items) {
            await prisma.serviceItem.deleteMany({
                where: { billId: id }
            });

            if (body.items.length > 0) {
                itemsUpdate = {
                    items: {
                        create: body.items.map((item: any) => ({
                            name: item.name,
                            price: item.price,
                            lifespanOdo: item.lifespanOdo || null,
                            lifespanMonths: item.lifespanMonths || null
                        }))
                    }
                };
            }
            delete body.items; // Remove from top level update payload
        }

        const currentBill = await prisma.bill.findUnique({
            where: { id: id },
            include: { items: true }
        });

        const updatedBill = await prisma.bill.update({
            where: { id: id },
            data: {
                ...body,
                ...itemsUpdate
            },
            include: {
                items: true
            }
        });

        // Trigger identical odometer constraint updating logic to old approveBill logic
        if (body.status === 'approved' && currentBill?.vehicleId && (body.odometer !== undefined || currentBill.odometer)) {
            const finalOdometer = body.odometer !== undefined ? body.odometer : currentBill.odometer;

            if (finalOdometer) {
                const vehicle = await prisma.vehicle.findUnique({ where: { id: currentBill.vehicleId } });
                if (vehicle && finalOdometer > vehicle.currentOdo) {
                    await prisma.vehicle.update({
                        where: { id: vehicle.id },
                        data: { currentOdo: finalOdometer }
                    });
                }
            }
        }

        return NextResponse.json(updatedBill);
    } catch (error: any) {
        console.error("Bill PATCH error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
