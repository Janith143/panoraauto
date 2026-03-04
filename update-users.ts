import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const ownerResult = await prisma.owner.updateMany({ data: { isEmailVerified: true } });
        console.log(`Updated ${ownerResult.count} owners to be verified.`);

        const garageResult = await prisma.garage.updateMany({ data: { isEmailVerified: true } });
        console.log(`Updated ${garageResult.count} garages to be verified.`);
    } catch (error) {
        console.error("Error updating users:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
