import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev_123';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return NextResponse.json({
            user: {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                name: decoded.name,
                notificationEmail: decoded.notificationEmail
            }
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ user: null }, { status: 401 });
    }
}
