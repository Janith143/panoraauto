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

        // If items contain lifespan properties and vehicle is linked, we should upsert vehicle_parts
        // Emulating processRecordItems here locally for data integrity via Prisma
        if (currentBill?.vehicleId && updatedBill.items && updatedBill.items.length > 0) {
            const vehicle = await prisma.vehicle.findUnique({ where: { id: currentBill.vehicleId } });
            const baseOdo = body.odometer !== undefined ? body.odometer : (currentBill.odometer ?? vehicle?.currentOdo ?? 0);

            for (const item of updatedBill.items) {
                if (item.lifespanOdo || item.lifespanMonths) {
                    const existingPart = await prisma.vehiclePart.findFirst({
                        where: { vehicleId: currentBill.vehicleId, name: item.name }
                    });

                    if (existingPart) {
                        await prisma.vehiclePart.update({
                            where: { id: existingPart.id },
                            data: {
                                lastServiceOdo: item.lifespanOdo ? baseOdo : undefined,
                                lifespanOdo: item.lifespanOdo || undefined,
                                lastServiceDate: item.lifespanMonths ? new Date() : undefined,
                                lifespanMonths: item.lifespanMonths || undefined
                            }
                        });
                    } else {
                        await prisma.vehiclePart.create({
                            data: {
                                vehicleId: currentBill.vehicleId,
                                name: item.name,
                                lastServiceOdo: item.lifespanOdo ? baseOdo : 0,
                                lifespanOdo: item.lifespanOdo || 0,
                                lastServiceDate: item.lifespanMonths ? new Date() : undefined,
                                lifespanMonths: item.lifespanMonths || null
                            }
                        });
                    }
                }
            }
        }

        return NextResponse.json(updatedBill);
    } catch (error: any) {
        console.error("Bill PATCH error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
