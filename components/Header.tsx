'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, Menu, X, LayoutDashboard, Settings, Truck, FileText, DollarSign, Users } from 'lucide-react';

const navLinks = {
    Masters: [
        { href: '/customer', label: 'Customer Master' },
        { href: '/all-customers', label: 'All Customers' },
        { href: '/rate-master', label: 'Rate Master' },
        { href: '/copy-rates', label: 'Copy Rate' },
        { href: '/rate-template', label: 'Customer Rate Template' },
        { href: '/tax-master', label: 'Tax Master' },
        { href: '/country-master', label: 'Country Master' },
        { href: '/zone-master', label: 'Zone Master' },
        { href: '/state-master', label: 'State Master' },
        { href: '/city-master', label: 'City Master' },
        { href: '/pincode-master', label: 'Pincode Master' },
        { href: '/invoice-settings', label: 'Invoice Configuration' },
        { href: '/registration-details', label: 'Modify Registration Details' },
        { href: '/book-rate-master', label: 'Book Rate Master' },
        { href: '/employee-master', label: 'Employee Master' },
        { href: '/create-user', label: 'Create User' },
        { href: '/sms-api-settings', label: 'SMS API Settings' },
        { href: '/sms-templates', label: 'SMS Templates' },
    ],
    Booking: [
        { href: '/cash-booking', label: 'Cash Booking (Domestic)' },
        { href: '/credit-client-booking', label: 'Credit Client Booking (Domestic)' },
        { href: '/international-cash-booking', label: 'Cash Booking (International)' },
        { href: '/international-credit-client-booking', label: 'Credit Client Booking (International)' },
        { href: '/booking-master', label: 'Booking Master' },
        { href: '/smart-booking-master', label: 'Smart Booking Master' },
        { href: '/all-bookings', label: 'All Bookings / Bulk Booking' },
        { href: '/update-and-send-delivery-status', label: 'Update Delivery Status / Send SMS' },
    ],
    Billings: [
        { href: '/generate-cash-invoice', label: 'Generate Invoice (Cash)' },
        { href: '/modify-delete-cash-invoice', label: 'Modify / Delete Invoice (Cash)' },
        { href: '/generate-credit-client-invoice', label: 'Generate Invoice (Credit)' },
        { href: '/modify-credit-client-invoice', label: 'Modify / Delete Invoice (Credit)' },
    ],
    Others: [
        { href: '/employee-attendance', label: 'Employee Attendance' },
        { href: '/docket-stock', label: 'Docket Stock' },
        { href: '/customer-payments', label: 'Customer Payments' },
    ],
};

const NavDropDown = ({ title, links }: { title: string, links: { href: string, label: string }[] }) => (
    <div className="relative group">
        <button className="flex items-center gap-1 px-4 py-2 text-white font-semibold hover:bg-blue-700 rounded-md transition-colors">
            {title}
            <ChevronDown className="w-4 h-4" />
        </button>
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 z-50 overflow-hidden">
            <div className="py-2">
                {links.map(link => (
                    <Link key={link.href} href={link.href} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        {link.label}
                    </Link>
                ))}
            </div>
        </div>
    </div>
);

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md sticky top-0 z-50">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-bold tracking-wider">
                            AGS Courier
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center space-x-2">
                        <Link href="/" className="px-4 py-2 text-white font-semibold hover:bg-blue-700 rounded-md transition-colors">Home</Link>
                        {Object.entries(navLinks).map(([title, links]) => (
                            <NavDropDown key={title} title={title} links={links} />
                        ))}
                    </div>
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none">
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700">Home</Link>
                        {Object.entries(navLinks).map(([title, links]) => (
                            <div key={title} className="pt-2">
                                <h3 className="px-3 text-xs font-semibold uppercase text-blue-200 tracking-wider">{title}</h3>
                                <div className="mt-1 space-y-1">
                                    {links.map(link => (
                                        <Link key={link.href} href={link.href} className="block pl-6 pr-3 py-2 rounded-md text-base font-medium hover:bg-blue-700">
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}