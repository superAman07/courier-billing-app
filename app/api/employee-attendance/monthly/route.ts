import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

// Check Admin Access
const checkAdminUser = async () => {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    if (!authCookie) return false;
    try {
        const user = JSON.parse(authCookie.value);
        return user?.userType === 'ADMIN';
    } catch (e) {
        return false;
    }
};

export async function GET(req: Request) {
    if (!await checkAdminUser()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || '');
    const year = parseInt(searchParams.get('year') || '');

    if (!month || !year) {
        return NextResponse.json({ error: 'Month and Year are required' }, { status: 400 });
    }

    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month

        // Fetch all employees
        const employees = await prisma.employeeMaster.findMany({
            orderBy: { employeeName: 'asc' },
        });

        // Fetch attendance for the range
        const attendances = await prisma.employeeAttendance.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        // Group attendance by employee
        const data = employees.map(emp => {
            const empAttendance = attendances.filter(a => a.employeeId === emp.id);
            return {
                ...emp,
                attendance: empAttendance
            };
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch monthly attendance:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}