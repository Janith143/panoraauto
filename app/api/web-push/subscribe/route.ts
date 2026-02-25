import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const prisma = new PrismaClient();

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${process.env.EMAIL_FROM || 'admin@example.com'}`,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn('VAPID keys are not set. Web push notifications will not work.');
}

export async function POST(req: Request) {
    try {
        const { subscription, userId } = await req.json();

        if (!subscription || !subscription.endpoint || !userId) {
            return NextResponse.json({ error: 'Invalid subscription data or missing userId' }, { status: 400 });
        }

        await prisma.webPushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userId: userId
            },
            create: {
                userId: userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Subscribe catch:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
