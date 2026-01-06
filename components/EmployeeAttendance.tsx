'use client';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar, Save, UserCheck, Clock, AlertTriangle, DollarSign, FileText, Loader2, Search } from 'lucide-react';

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
    travelDistance: number | null;
    travelAmount: number | null;
    ratePerKm: number;
    remarks: string;
}

const formatTimeForInput = (date: Date | string | null): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const formatMinutesToHHMM = (totalMinutes: number | null) => {
    if (!totalMinutes || totalMinutes <= 0) return "0:00";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

const formatDecimalHoursToHHMM = (decimalHours: number | null) => {
    if (!decimalHours || decimalHours <= 0) return "0:00";
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

export default function EmployeeAttendancePage() {
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [globalRatePerKm, setGlobalRatePerKm] = useState(0);

    useEffect(() => {
        axios.get('/api/employee-settings')
             .then(res => setGlobalRatePerKm(res.data.ratePerKm || 0))
             .catch(err => console.error("Failed to load global rate"));
    }, []);

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

    const filteredData = useMemo(() => {
        if (!search) return attendanceData;
        const lowercasedSearch = search.toLowerCase();
        return attendanceData.filter(att =>
            att.employeeName.toLowerCase().includes(lowercasedSearch) ||
            att.employeeCode.toLowerCase().includes(lowercasedSearch)
        );
    }, [attendanceData, search]);

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
                    if (field === 'travelDistance') {
                        const dist = parseFloat(value) || 0;
                        updatedRecord.travelAmount = parseFloat((dist * globalRatePerKm).toFixed(2));
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
            const payload = attendanceData.map(att => {
                // FIX: Convert "HH:MM" string to a full local Date object, then to ISO string
                // This ensures "11:00" in your browser becomes the correct moment in time (e.g. 05:30 UTC)
                // instead of ambiguous "T11:00" which backend assumes is 11:00 UTC.
                let checkInISO = null;
                let checkOutISO = null;

                if (att.checkIn) {
                    const d = new Date(`${attendanceDate}T${att.checkIn}`);
                    checkInISO = d.toISOString();
                }
                
                if (att.checkOut) {
                    const d = new Date(`${attendanceDate}T${att.checkOut}`);
                    checkOutISO = d.toISOString();
                }

                return {
                    ...att,
                    checkIn: checkInISO,
                    checkOut: checkOutISO,
                };
            });
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
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1400px] bg-white rounded-lg shadow-xl ring-1 ring-slate-200 overflow-hidden">
                <header className="p-5 md:p-6 border-b border-slate-200 bg-slate-900">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <UserCheck className="w-8 h-8 text-teal-400" aria-hidden="true" />
                            <h1 className="text-pretty text-2xl md:text-3xl font-semibold text-white tracking-tight">
                                Employee Attendance
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <label htmlFor="attendanceDate" className="sr-only">
                                Select attendance date
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search Employee..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 pr-4 py-2 border text-gray-700 bg-gray-100 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-semibold"
                                />
                            </div>
                            <div className="relative">
                                <Calendar
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                                    aria-hidden="true"
                                />
                                <input
                                    type="date"
                                    id="attendanceDate"
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                    aria-label="Attendance date"
                                    className="pl-10 pr-4 py-2 rounded-md border border-slate-300 bg-white text-slate-800 text-sm shadow-sm
                                               focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving || loading}
                                className="inline-flex items-center cursor-pointer gap-2 px-4 md:px-5 py-2 rounded-md font-medium
                                           bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-700
                                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
                                           disabled:bg-teal-300 disabled:cursor-not-allowed transition-colors"
                                aria-label="Save attendance"
                                title="Save attendance"
                            >
                                {saving ? (
                                    <Loader2 className="animate-spin w-5 h-5" aria-hidden="true" />
                                ) : (
                                    <Save className="w-5 h-5" aria-hidden="true" />
                                )}
                                {saving ? "Saving..." : "Save Attendance"}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto divide-y divide-slate-200">
                        <thead>
                            <tr>
                                <th className={thStyle}>Employee</th>
                                <th className={thStyle}>Status</th>
                                <th className={thStyle}>
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="w-4 h-4" aria-hidden="true" /> Check-In
                                    </span>
                                </th>
                                <th className={thStyle}>
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="w-4 h-4" aria-hidden="true" /> Check-Out
                                    </span>
                                </th>
                                <th className={thStyle}>Total Hrs</th>
                                <th className={thStyle}>Overtime (hh:mm)</th>
                                <th className={thStyle}>
                                    <span className="inline-flex items-center gap-1">
                                        <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Late(hh:mm)
                                    </span>
                                </th>
                                <th className={thStyle}>Travel (km)</th>
                                <th className={thStyle}>
                                    <span className="inline-flex items-center gap-1">
                                        <DollarSign className="w-4 h-4" aria-hidden="true" /> Travel Amt
                                    </span>
                                </th>
                                <th className={thStyle}>
                                    <span className="inline-flex items-center gap-1">
                                        <DollarSign className="w-4 h-4" aria-hidden="true" /> Fine
                                    </span>
                                </th>
                                <th className={thStyle}>
                                    <span className="inline-flex items-center gap-1">
                                        <DollarSign className="w-4 h-4" aria-hidden="true" /> Advance
                                    </span>
                                </th>
                                <th className={thStyle}>
                                    <span className="inline-flex items-center gap-1">
                                        <FileText className="w-4 h-4" aria-hidden="true" /> Remarks
                                    </span>
                                </th>
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-12">
                                        <Loader2
                                            className="mx-auto animate-spin w-8 h-8 text-slate-500"
                                            aria-label="Loading attendance data"
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((att) => (
                                    <tr key={att.employeeId} className="odd:bg-white even:bg-slate-50 hover:bg-teal-50 transition-colors">
                                        <td className="px-3 py-3 whitespace-nowrap align-top">
                                            <div className="text-sm font-medium text-slate-900">{att.employeeName}</div>
                                            <div className="text-xs text-slate-500">{att.employeeCode}</div>
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap w-40 align-top">
                                            <select
                                                value={att.status}
                                                onChange={(e) => handleAttendanceChange(att.employeeId, "status", e.target.value)}
                                                className={`${inputStyle} cursor-pointer`}
                                                aria-label={`Status for ${att.employeeName}`}
                                            >
                                                <option>Present</option>
                                                <option>Absent</option>
                                                <option>Leave</option>
                                                <option>HalfDay</option>
                                                <option>ShortLeave</option>
                                                <option>Holiday</option>
                                            </select>
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap w-36 align-top">
                                            <input
                                                type="time"
                                                value={att.checkIn || ""}
                                                onChange={(e) => handleAttendanceChange(att.employeeId, "checkIn", e.target.value)}
                                                className={inputStyle}
                                                aria-label={`Check-in time for ${att.employeeName}`}
                                            />
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap w-36 align-top">
                                            <input
                                                type="time"
                                                value={att.checkOut || ""}
                                                onChange={(e) => handleAttendanceChange(att.employeeId, "checkOut", e.target.value)}
                                                className={inputStyle}
                                                aria-label={`Check-out time for ${att.employeeName}`}
                                            />
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap text-center align-top">
                                            <span className="inline-flex items-center justify-center min-w-[64px] text-sm font-mono px-2.5 py-1 rounded-md bg-slate-100 text-slate-800">
                                                {formatDecimalHoursToHHMM(att.totalHours)}
                                            </span>
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap text-center align-top">
                                            <span className="inline-flex items-center justify-center min-w-[64px] text-sm font-mono px-2.5 py-1 rounded-md bg-teal-50 text-teal-700">
                                                {formatDecimalHoursToHHMM(att.overtimeHours)}
                                            </span>
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap text-center align-top">
                                            <span
                                                className={`inline-flex items-center justify-center min-w-[56px] text-sm font-mono px-2.5 py-1 rounded-md ${att.lateByMinutes ? "bg-red-50 text-red-700 font-bold" : "bg-slate-100 text-slate-600"
                                                    }`}
                                                title={att.lateByMinutes ? `${att.lateByMinutes} minutes` : ""}
                                            >
                                                {formatMinutesToHHMM(att.lateByMinutes)}
                                            </span>
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap w-24 align-top">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={att.travelDistance || ""}
                                                onChange={(e) => handleAttendanceChange(att.employeeId, "travelDistance", e.target.value)}
                                                className={inputStyle}
                                            />
                                            <div className="text-[10px] text-gray-400 text-center">@{globalRatePerKm}/km</div>
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap w-24 align-top">
                                             <input
                                                type="number"
                                                readOnly
                                                value={att.travelAmount || ""}
                                                className={`${inputStyle} bg-gray-50 text-blue-600 font-semibold`}
                                            />
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap w-32 align-top">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={att.fineAmount || ""}
                                                onChange={(e) => handleAttendanceChange(att.employeeId, "fineAmount", e.target.value)}
                                                className={inputStyle}
                                                aria-label={`Fine amount for ${att.employeeName}`}
                                                inputMode="decimal"
                                            />
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap w-32 align-top">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={att.advanceAmount || ""}
                                                onChange={(e) => handleAttendanceChange(att.employeeId, "advanceAmount", e.target.value)}
                                                className={inputStyle}
                                                aria-label={`Advance amount for ${att.employeeName}`}
                                                inputMode="decimal"
                                            />
                                        </td>

                                        <td className="px-3 py-3 whitespace-nowrap w-64 align-top">
                                            <input
                                                type="text"
                                                placeholder="Remarks..."
                                                value={att.remarks}
                                                onChange={(e) => handleAttendanceChange(att.employeeId, "remarks", e.target.value)}
                                                className={inputStyle}
                                                aria-label={`Remarks for ${att.employeeName}`}
                                            />
                                        </td>
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