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

const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
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

        const employees = await prisma.employeeMaster.findMany({
            orderBy: { employeeName: 'asc' },
        });

        const attendances = await prisma.employeeAttendance.findMany({
            where: { date: targetDate },
        });

        const attendanceMap = new Map(attendances.map(a => [a.employeeId, a]));

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

        const employeeShiftInfo = await prisma.employeeMaster.findMany({
            where: { id: { in: attendanceData.map(a => a.employeeId) } },
            select: { id: true, shiftStartTime: true, workingHours: true }
        });
        const shiftMap = new Map(employeeShiftInfo.map(e => [e.id, { shiftStartTime: e.shiftStartTime, workingHours: e.workingHours }]));

        const transactions = attendanceData.map((att: any) => {
            const shift = shiftMap.get(att.employeeId);
            let totalHours = null, overtimeHours = null, lateByMinutes = null;

            const checkInTime = att.checkIn ? new Date(att.checkIn) : null;
            const checkOutTime = att.checkOut ? new Date(att.checkOut) : null;

            if (checkInTime && checkOutTime && checkOutTime > checkInTime) {
                totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
                if (shift?.workingHours && totalHours > shift.workingHours) {
                    overtimeHours = totalHours - shift.workingHours;
                }
            }

            if (checkInTime && shift?.shiftStartTime) {
                const shiftStartMinutes = timeToMinutes(shift.shiftStartTime);
                const checkInMinutes = checkInTime.getHours() * 60 + checkInTime.getMinutes();
                if (checkInMinutes > shiftStartMinutes) {
                    lateByMinutes = checkInMinutes - shiftStartMinutes;
                }
            }

            return prisma.employeeAttendance.upsert({
                where: { employeeId_date: { employeeId: att.employeeId, date: targetDate } },
                update: {
                    status: att.status,
                    checkIn: checkInTime,
                    checkOut: checkOutTime,
                    remarks: att.remarks,
                    fineAmount: att.fineAmount ? parseFloat(att.fineAmount) : null,
                    advanceAmount: att.advanceAmount ? parseFloat(att.advanceAmount) : null,
                    totalHours,
                    overtimeHours,
                    lateByMinutes,
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
                    totalHours,
                    overtimeHours,
                    lateByMinutes,
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