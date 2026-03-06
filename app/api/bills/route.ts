import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev_123';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const user = jwt.verify(token, JWT_SECRET) as any;

        const body = await request.json();

        // This endpoint acts as the aggregator for either Garages or Owners adding bills
        // It mirrors the previous Supabase logic in VehicleContext sendBill / addManualRecord

        let vehicleId = body.vehicleId;
        let status = body.status || 'pending';

        // Garage attempting to link to a registered vehicle by plate
        if (user.role === 'garage' && body.plate && !vehicleId) {
            const normalizedPlate = body.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            const matchingVehicle = await prisma.vehicle.findUnique({
                where: { plate: normalizedPlate }
            });
            if (matchingVehicle) {
                vehicleId = matchingVehicle.id;
            } else {
                status = 'approved'; // Unmatched garage records are auto-approved locally for the garage
            }
        }

        const newBill = await prisma.bill.create({
            data: {
                garageId: body.garageId,
                garageCustomerId: body.garageCustomerId || null,
                vehicleId: vehicleId || null,
                plate: body.plate,
                amount: body.amount,
                discount: body.discount || 0,
                odometer: body.odometer || null,
                notes: body.notes || null,
                status: status,
                source: body.source || user.role,
                photos: body.photos !== undefined ? body.photos : undefined,

                // Nested create for items
                items: {
                    create: body.items?.map((item: any) => ({
                        name: item.name,
                        price: item.price,
                        lifespanOdo: item.lifespanOdo || null,
                        lifespanMonths: item.lifespanMonths || null
                    })) || []
                }
            },
            include: {
                items: true
            }
        });

        // If items contain lifespan properties and vehicle is linked, we should upsert vehicle_parts
        // Emulating processRecordItems here locally for data integrity via Prisma
        if (vehicleId && body.items && body.items.length > 0) {
            const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
            const baseOdo = body.odometer ?? vehicle?.currentOdo ?? 0;

            for (const item of body.items) {
                if (item.lifespanOdo || item.lifespanMonths) {
                    const existingPart = await prisma.vehiclePart.findFirst({
                        where: { vehicleId, name: item.name }
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
                                vehicleId,
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

        return NextResponse.json(newBill);
    } catch (error: any) {
        console.error("Bill POST error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
