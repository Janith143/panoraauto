import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import webpush from 'web-push';

const prisma = new PrismaClient();

webpush.setVapidDetails(
    `mailto:${process.env.EMAIL_FROM || 'admin@example.com'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
);

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '465'),
    secure: true,
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
});

async function sendEmailAndPush(userId: string, email: string, title: string, message: string) {
    // 1. Send Email
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: title,
            text: message,
            html: `<h3>${title}</h3><p>${message}</p>`,
        });
        console.log(`Email sent to ${email}`);
    } catch (e) {
        console.error("Email send error:", e);
    }

    // 2. Send Push Notification
    try {
        const subs = await prisma.webPushSubscription.findMany({
            where: { userId }
        });

        if (subs && subs.length > 0) {
            for (const sub of subs) {
                const pushConfig = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                };
                try {
                    await webpush.sendNotification(pushConfig, JSON.stringify({ title, body: message }));
                    console.log(`Push sent to user ${userId}`);
                } catch (pushErr: any) {
                    if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                        // Subscription has expired or is no longer valid
                        await prisma.webPushSubscription.delete({
                            where: { id: sub.id }
                        });
                    } else {
                        console.error('Push error:', pushErr);
                    }
                }
            }
        }
    } catch (e) {
        console.error("Push process error:", e);
    }
}

export async function GET(req: Request) {
    try {
        const owners = await prisma.owner.findMany({
            include: {
                vehicles: {
                    include: {
                        parts: true
                    }
                }
            }
        });

        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        let notificationsSent = 0;

        for (const owner of owners) {
            for (const v of owner.vehicles) {
                // Check dates
                if (v.revenueLicenseDate && v.revenueLicenseDate <= thirtyDaysFromNow && v.revenueLicenseDate > now) {
                    await sendEmailAndPush(owner.id, owner.email, 'Upcoming Revenue License Expiry', `Your Revenue License for ${v.plate} is expiring soon on ${v.revenueLicenseDate.toLocaleDateString()}.`);
                    notificationsSent++;
                }

                if (v.insuranceDate && v.insuranceDate <= thirtyDaysFromNow && v.insuranceDate > now) {
                    await sendEmailAndPush(owner.id, owner.email, 'Upcoming Insurance Expiry', `Your Insurance for ${v.plate} is expiring soon on ${v.insuranceDate.toLocaleDateString()}.`);
                    notificationsSent++;
                }

                if (v.emissionReportDate && v.emissionReportDate <= thirtyDaysFromNow && v.emissionReportDate > now) {
                    await sendEmailAndPush(owner.id, owner.email, 'Upcoming Emission Report Expiry', `Your Emission Report for ${v.plate} is expiring soon on ${v.emissionReportDate.toLocaleDateString()}.`);
                    notificationsSent++;
                }

                // Check parts
                for (const p of v.parts) {
                    const usedOdo = v.currentOdo - p.lastServiceOdo;
                    if (p.lifespanOdo && usedOdo >= (p.lifespanOdo * 0.9)) {
                        await sendEmailAndPush(owner.id, owner.email, 'Maintenance Required Soon: Mileage', `The ${p.name} on your ${v.plate} has reached ${(usedOdo / p.lifespanOdo * 100).toFixed(0)}% of its mileage lifespan.`);
                        notificationsSent++;
                    }

                    if (p.lifespanMonths && p.lastServiceDate) {
                        const lastDate = new Date(p.lastServiceDate);
                        const monthsElapsed = (now.getFullYear() - lastDate.getFullYear()) * 12 + now.getMonth() - lastDate.getMonth();
                        if (monthsElapsed >= (p.lifespanMonths * 0.9)) {
                            await sendEmailAndPush(owner.id, owner.email, 'Maintenance Required Soon: Time', `The ${p.name} on your ${v.plate} is nearing its time-based replacement schedule.`);
                            notificationsSent++;
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true, notificationsSent });

    } catch (err: any) {
        console.error('Cron job error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
