'use client';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar, Save, UserCheck, Clock, AlertTriangle, DollarSign, FileText, Loader2 } from 'lucide-react';

interface AttendanceRecord {
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    shiftStartTime: string | null;
    workingHours: number | null;
    status: string;
    checkIn: string | null;
    checkOut: string | null;
    totalHours: number | null;
    overtimeHours: number | null;
    lateByMinutes: number | null;
    fineAmount: number | null;
    advanceAmount: number | null;
    remarks: string;
}

const formatTimeForInput = (date: Date | string | null): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

export default function EmployeeAttendancePage() {
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchAttendance = async (date: string) => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/employee-attendance', { params: { date } });
            setAttendanceData(data.map((d: any) => ({
                ...d,
                checkIn: formatTimeForInput(d.checkIn),
                checkOut: formatTimeForInput(d.checkOut),
            })));
        } catch (error: any) {
            const msg = error?.response?.data?.error || 'Failed to fetch attendance data.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (attendanceDate) {
            fetchAttendance(attendanceDate);
        }
    }, [attendanceDate]);

    const handleAttendanceChange = (employeeId: string, field: keyof AttendanceRecord, value: any) => {
        setAttendanceData(prevData =>
            prevData.map(record => {
                if (record.employeeId === employeeId) {
                    const updatedRecord = { ...record, [field]: value };

                    // Live calculations for immediate feedback
                    const { checkIn, checkOut, shiftStartTime, workingHours } = updatedRecord;
                    if (checkIn && checkOut) {
                        const start = new Date(`${attendanceDate}T${checkIn}`);
                        const end = new Date(`${attendanceDate}T${checkOut}`);
                        if (end > start) {
                            const totalHrs = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                            updatedRecord.totalHours = parseFloat(totalHrs.toFixed(2));
                            if (workingHours && totalHrs > workingHours) {
                                updatedRecord.overtimeHours = parseFloat((totalHrs - workingHours).toFixed(2));
                            } else {
                                updatedRecord.overtimeHours = 0;
                            }
                        }
                    }
                    if (checkIn && shiftStartTime) {
                        const shiftStart = new Date(`${attendanceDate}T${shiftStartTime}`);
                        const arrival = new Date(`${attendanceDate}T${checkIn}`);
                        if (arrival > shiftStart) {
                            updatedRecord.lateByMinutes = Math.round((arrival.getTime() - shiftStart.getTime()) / (1000 * 60));
                        } else {
                            updatedRecord.lateByMinutes = 0;
                        }
                    }
                    return updatedRecord;
                }
                return record;
            })
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = attendanceData.map(att => ({
                ...att,
                checkIn: att.checkIn ? `${attendanceDate}T${att.checkIn}` : null,
                checkOut: att.checkOut ? `${attendanceDate}T${att.checkOut}` : null,
            }));
            await axios.post('/api/employee-attendance', { date: attendanceDate, attendanceData: payload });
            toast.success('Attendance saved successfully!');
            fetchAttendance(attendanceDate);
        } catch (error: any) {
            const msg = error?.response?.data?.error || 'Failed to save attendance.';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = "w-full p-2 border text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs";
    const thStyle = "px-3 py-3 text-left text-xs font-semibold text-gray-100 bg-gray-700 uppercase tracking-wider sticky top-0";

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-full mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-slate-800 via-slate-900 to-black shadow-md flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <UserCheck className="w-8 h-8 text-teal-300" />
                        <h1 className="text-2xl font-bold text-white tracking-wider">Employee Attendance</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                id="attendanceDate"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                className="pl-10 pr-4 py-2 border text-gray-700 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-semibold"
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg cursor-pointer font-bold shadow-lg transition-transform transform hover:scale-105 disabled:bg-teal-300 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                            {saving ? 'Saving...' : 'Save Attendance'}
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className={thStyle}>Employee</th>
                                <th className={thStyle}>Status</th>
                                <th className={thStyle}><Clock className="inline-block w-4 h-4 mr-1" />Check-In</th>
                                <th className={thStyle}><Clock className="inline-block w-4 h-4 mr-1" />Check-Out</th>
                                <th className={thStyle}>Total Hrs</th>
                                <th className={thStyle}>Overtime</th>
                                <th className={thStyle}><AlertTriangle className="inline-block w-4 h-4 mr-1" />Late (min)</th>
                                <th className={thStyle}><DollarSign className="inline-block w-4 h-4 mr-1" />Fine</th>
                                <th className={thStyle}><DollarSign className="inline-block w-4 h-4 mr-1" />Advance</th>
                                <th className={thStyle}><FileText className="inline-block w-4 h-4 mr-1" />Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={10} className="text-center py-10"><Loader2 className="mx-auto animate-spin w-8 h-8 text-gray-500" /></td></tr>
                            ) : (
                                attendanceData.map(att => (
                                    <tr key={att.employeeId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="font-bold text-sm text-gray-800">{att.employeeName}</div>
                                            <div className="text-xs text-gray-500">{att.employeeCode}</div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap w-40">
                                            <select value={att.status} onChange={(e) => handleAttendanceChange(att.employeeId, 'status', e.target.value)} className={`${inputStyle} cursor-pointer`}>
                                                <option>Present</option><option>Absent</option><option>Leave</option><option>HalfDay</option><option>ShortLeave</option><option>Holiday</option>
                                            </select>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap w-32"><input type="time" value={att.checkIn || ''} onChange={(e) => handleAttendanceChange(att.employeeId, 'checkIn', e.target.value)} className={inputStyle} /></td>
                                        <td className="px-3 py-2 whitespace-nowrap w-32"><input type="time" value={att.checkOut || ''} onChange={(e) => handleAttendanceChange(att.employeeId, 'checkOut', e.target.value)} className={inputStyle} /></td>
                                        <td className="px-3 py-2 whitespace-nowrap text-center"><span className="text-sm font-mono p-2 rounded-md bg-blue-50 text-blue-700">{att.totalHours?.toFixed(2) || '0.00'}</span></td>
                                        <td className="px-3 py-2 whitespace-nowrap text-center"><span className="text-sm font-mono p-2 rounded-md bg-green-50 text-green-700">{att.overtimeHours?.toFixed(2) || '0.00'}</span></td>
                                        <td className="px-3 py-2 whitespace-nowrap text-center"><span className={`text-sm font-mono p-2 rounded-md ${att.lateByMinutes ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{att.lateByMinutes || 0}</span></td>
                                        <td className="px-3 py-2 whitespace-nowrap w-32"><input type="number" placeholder="0.00" value={att.fineAmount || ''} onChange={(e) => handleAttendanceChange(att.employeeId, 'fineAmount', e.target.value)} className={inputStyle} /></td>
                                        <td className="px-3 py-2 whitespace-nowrap w-32"><input type="number" placeholder="0.00" value={att.advanceAmount || ''} onChange={(e) => handleAttendanceChange(att.employeeId, 'advanceAmount', e.target.value)} className={inputStyle} /></td>
                                        <td className="px-3 py-2 whitespace-nowrap w-64"><input type="text" placeholder="Remarks..." value={att.remarks} onChange={(e) => handleAttendanceChange(att.employeeId, 'remarks', e.target.value)} className={inputStyle} /></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}