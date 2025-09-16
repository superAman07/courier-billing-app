'use client'
import Link from 'next/link';
import { Users, Truck, FileText, DollarSign, ClipboardList, CalendarCheck, Package, UserCheck } from 'lucide-react';

const quickAccessLinks = [
    { href: '/all-customers', label: 'All Customers', icon: Users, description: "View and manage all customers" },
    { href: '/smart-booking-master', label: 'Smart Booking', icon: Truck, description: "Bulk import and edit bookings" },
    { href: '/all-bookings', label: 'All Bookings', icon: Truck, description: "View and manage all bookings" },
    { href: '/update-and-send-delivery-status', label: 'Update Delivery Status', icon: ClipboardList, description: "Update status and send SMS" },
    { href: '/generate-cash-invoice', label: 'Cash Invoices', icon: FileText, description: "Generate invoices for cash bookings" },
    { href: '/generate-credit-client-invoice', label: 'Credit Invoices', icon: FileText, description: "Generate invoices for credit clients" },
    { href: '/employee-attendance', label: 'Employee Attendance', icon: CalendarCheck, description: "Mark and track attendance" },
    { href: '/docket-stock', label: 'Docket Stock', icon: Package, description: "Manage your docket inventory" },
    { href: '/customer-payments', label: 'Customer Payments', icon: DollarSign, description: "Record and track payments" },
];

const DashboardCard = ({ href, label, icon: Icon, description }: typeof quickAccessLinks[0]) => (
    <Link href={href} className="group block p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 border border-gray-200/80 transition-all duration-300">
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-6 h-6" />
        </div>
        <div className="mt-4">
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{label}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
    </Link>
);

export default function Home() {
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <header className="mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
                <p className="mt-2 text-lg text-gray-600">Welcome back! Here's your quick access to daily operations.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {quickAccessLinks.map(link => (
                    <DashboardCard key={link.href} {...link} />
                ))}
            </div>
        </div>
    );
}