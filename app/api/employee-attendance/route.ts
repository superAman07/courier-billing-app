import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

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
    if (!checkAdminUser()) {
        return NextResponse.json({ error: 'Unauthorized: Access is restricted to administrators.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    try {
        const targetDate = new Date(date);

        // 1. Fetch all employees
        const employees = await prisma.employeeMaster.findMany({
            orderBy: { employeeName: 'asc' },
        });

        // 2. Fetch existing attendance for this date
        const attendances = await prisma.employeeAttendance.findMany({
            where: { date: targetDate },
        });

        const attendanceMap = new Map(attendances.map(a => [a.employeeId, a]));

        // 3. Merge data
        const response = employees.map(emp => {
            const attendance = attendanceMap.get(emp.id);
            return {
                employeeId: emp.id,
                employeeCode: emp.employeeCode,
                employeeName: emp.employeeName,
                shiftStartTime: emp.shiftStartTime,
                workingHours: emp.workingHours,
                status: attendance?.status || 'Present',
                checkIn: attendance?.checkIn,
                checkOut: attendance?.checkOut,
                totalHours: attendance?.totalHours,
                overtimeHours: attendance?.overtimeHours,
                lateByMinutes: attendance?.lateByMinutes,
                fineAmount: attendance?.fineAmount || 0,
                advanceAmount: attendance?.advanceAmount || 0,
                // --- NEW FIELD INCLUDED IN RESPONSE ---
                travelDistance: attendance?.travelDistance || 0,
                remarks: attendance?.remarks || '',
            };
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error('Failed to fetch attendance:', error);
        return NextResponse.json({ error: 'Failed to fetch attendance data' }, { status: 500 });
    }
}

export async function POST(req: Request) { 
    if (!checkAdminUser()) {
        return NextResponse.json({ error: 'Unauthorized: Access is restricted to administrators.' }, { status: 403 });
    }

    try {
        const { date, attendanceData } = await req.json();

        if (!date || !Array.isArray(attendanceData)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        const targetDate = new Date(date);

        // We REMOVED the logic that fetched "shiftInfo" and recalculated hours here.
        // This fixes the bug. We now trust the values sent from the Frontend.

        const transactions = attendanceData.map((att: any) => {
            // Just convert timestamps to valid Dates for storage
            const checkInTime = att.checkIn ? new Date(att.checkIn) : null;
            const checkOutTime = att.checkOut ? new Date(att.checkOut) : null;

            return prisma.employeeAttendance.upsert({
                where: { employeeId_date: { employeeId: att.employeeId, date: targetDate } },
                update: {
                    status: att.status,
                    checkIn: checkInTime,
                    checkOut: checkOutTime,
                    remarks: att.remarks,
                    fineAmount: att.fineAmount ? parseFloat(att.fineAmount) : null,
                    advanceAmount: att.advanceAmount ? parseFloat(att.advanceAmount) : null,
                    // --- SAVE VALUES DIRECTLY FROM FRONTEND ---
                    totalHours: att.totalHours,
                    overtimeHours: att.overtimeHours,
                    lateByMinutes: att.lateByMinutes,
                    travelDistance: att.travelDistance ? parseFloat(att.travelDistance) : 0,
                },
                create: {
                    employeeId: att.employeeId,
                    date: targetDate,
                    status: att.status,
                    checkIn: checkInTime,
                    checkOut: checkOutTime,
                    remarks: att.remarks,
                    fineAmount: att.fineAmount ? parseFloat(att.fineAmount) : null,
                    advanceAmount: att.advanceAmount ? parseFloat(att.advanceAmount) : null,
                    // --- SAVE VALUES DIRECTLY FROM FRONTEND ---
                    totalHours: att.totalHours,
                    overtimeHours: att.overtimeHours,
                    lateByMinutes: att.lateByMinutes,
                    travelDistance: att.travelDistance ? parseFloat(att.travelDistance) : 0,
                },
            });
        });

        await prisma.$transaction(transactions);

        return NextResponse.json({ message: 'Attendance saved successfully' });
    } catch (error) {
        console.error('Failed to save attendance:', error);
        return NextResponse.json({ error: 'Failed to save attendance data' }, { status: 500 });
    }
}