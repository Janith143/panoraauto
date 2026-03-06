import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        const vehicle = await prisma.vehicle.findUnique({
            where: { shareToken: token },
            include: {
                bills: {
                    where: { status: 'approved' },
                    orderBy: { date: 'desc' }
                },
                parts: true
            }
        });

        if (!vehicle) {
            return NextResponse.json({ error: 'Vehicle profile not found or link has expired' }, { status: 404 });
        }

        const preferences: any = vehicle.sharePreferences || {};

        // Strip sensitive/unshared data
        const publicVehicle: any = {
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            plate: vehicle.plate,
            photo: vehicle.photo,
        };

        if (preferences.showOdometer) {
            publicVehicle.currentOdo = vehicle.currentOdo;
            publicVehicle.engineType = vehicle.engineType;
            publicVehicle.vin = vehicle.vin;
            publicVehicle.parts = vehicle.parts;
        }

        if (preferences.showMaintenanceHistory) {
            publicVehicle.bills = vehicle.bills;
        }

        if (preferences.showLegalDocs) {
            publicVehicle.revenueLicenseDate = vehicle.revenueLicenseDate;
            publicVehicle.revenueLicensePhoto = vehicle.revenueLicensePhoto;
            publicVehicle.insuranceDate = vehicle.insuranceDate;
            publicVehicle.insurancePhoto = vehicle.insurancePhoto;
            publicVehicle.emissionReportDate = vehicle.emissionReportDate;
            publicVehicle.emissionReportPhoto = vehicle.emissionReportPhoto;
        }

        return NextResponse.json(publicVehicle);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
