'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronDown, Menu, X, LayoutDashboard, Settings, Truck, FileText, DollarSign, Users, LogOut, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

const navLinks = {
    Masters: [
        // — Location Masters —
        { href: '', label: '— Location —', isHeader: true },
        { href: '/zone-master', label: 'Zone Master' },
        { href: '/sector-master', label: 'Sector Master' },
        { href: '/state-master', label: 'State Master' },
        { href: '/city-master', label: 'City Master' },
        { href: '/pincode-master', label: 'Pincode Master' },
        { href: '/country-master', label: 'Country Master' },
        // — Customer & Rates —
        { href: '', label: '— Customer & Rates —', isHeader: true },
        { href: '/customer', label: 'Customer Master' },
        { href: '/all-customers', label: 'All Customers' },
        { href: '/rate-template', label: 'Customer Rate Template' },
        { href: '/tax-master', label: 'Tax Master' },
        { href: '/book-rate-master', label: 'Book Rate Master' },
        // — Configuration —
        { href: '', label: '— Configuration —', isHeader: true },
        { href: '/invoice-settings', label: 'Invoice Configuration' },
        { href: '/registration-details', label: 'Registration Details' },
        { href: '/employee-master', label: 'Employee Master' },
        { href: '/create-user', label: 'Create User' },
        // — Communications —
        { href: '', label: '— Communications —', isHeader: true },
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
        { href: '/all-invoices', label: 'All Invoices' },
        { href: '/generate-cash-invoice', label: 'Generate Invoice (Cash)' },
        { href: '/modify-delete-cash-invoice', label: 'Modify / Delete Invoice (Cash)' },
        { href: '/generate-credit-client-invoice', label: 'Generate Invoice (Credit)' },
        { href: '/modify-credit-client-invoice', label: 'Modify / Delete Invoice (Credit)' },
    ],
    New_Rates: [
        { href: '/new-rate-master', label: 'New Rate Master' },
        { href: '/new-copy-rates', label: 'New Copy Rates' },
    ],
    Others: [
        { href: '/employee-attendance', label: 'Employee Attendance' },
        { href: '/docket-stock', label: 'Docket Stock' },
        { href: '/customer-payments', label: 'Customer Payments' },
        { href: '/sale-expense', label: 'Sale Expense' },
    ],
};

const NavDropDown = ({ title, links }: { title: string, links: { href: string, label: string, isHeader?: boolean }[] }) => (
    <div className="relative group">
        <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-white/90 font-medium hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200">
            {title}
            <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
        </button>
        <div className="absolute top-full left-0 mt-3 w-72 max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-500 transform translate-y-2 group-hover:translate-y-0 z-50 border border-gray-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl"></div>
            <div className="relative py-3">
                {links.map((link, index) =>
                    link.isHeader ? (
                        <div key={link.label} className="px-5 pt-4 pb-1 first:pt-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{link.label.replace(/—/g, '').trim()}</span>
                            <div className="border-b border-indigo-100 mt-1"></div>
                        </div>
                    ) : (
                        <Link 
                            key={link.href} 
                            href={link.href} 
                            className="block px-5 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 hover:text-white transition-all duration-300 transform hover:translate-x-2 hover:shadow-md mx-2 rounded-xl"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-60"></div>
                                {link.label}
                            </div>
                        </Link>
                    )
                )}
            </div>
        </div>
    </div>
);

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setIsLoggedIn(true);
        }

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async()=> {
        try {
            await axios.post('/api/logout');
            localStorage.removeItem('userInfo');
            toast.success('You have been logged out.');
            router.push('/login');
        } catch (error) {
            toast.error('Logout failed. Please try again.');
        }
    }
    
    if(!isLoggedIn){
        return null;
    }

    return (
        <header className={`bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg sticky top-0 z-50 print:hidden transition-all duration-300 ${scrolled ? 'shadow-xl' : ''}`}> 
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="group flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center border border-white/20 group-hover:bg-white/25 transition-all duration-300">
                                <Truck className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-wide">
                                    AGS Courier
                                </h1>
                                <div className="text-[10px] text-blue-200/70 font-medium tracking-wider uppercase">Professional Logistics</div>
                            </div>
                        </Link>
                    </div>
                    
                    <div className="hidden md:flex items-center space-x-2">
                        <Link 
                            href="/" 
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/90 font-medium hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Home
                        </Link>
                        
                        {Object.entries(navLinks).map(([title, links]) => (
                            <NavDropDown key={title} title={title.replace(/_/g, ' ')} links={links} />
                        ))}
                        
                        <button 
                            onClick={handleLogout} 
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white cursor-pointer font-medium bg-red-500/80 hover:bg-red-500 rounded-lg transition-all duration-200"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                    
                    <div className="md:hidden flex items-center">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                            className="inline-flex items-center justify-center p-2 rounded-xl text-white hover:bg-white/10 focus:outline-none transition-all duration-300 transform hover:scale-110 border border-white/10 hover:border-white/20"
                        >
                            {isMobileMenuOpen ? 
                                <X className="w-6 h-6 transition-transform duration-300 rotate-90" /> : 
                                <Menu className="w-6 h-6 transition-transform duration-300" />
                            }
                        </button>
                    </div>
                </div>
            </nav>

            <div className={`md:hidden transition-all duration-500 transform ${isMobileMenuOpen ? 'max-h-screen opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'} overflow-hidden`}>
                <div className="bg-gradient-to-b from-blue-700/95 to-indigo-800/95 backdrop-blur-xl border-t border-white/10">
                    <div className="px-4 pt-4 pb-6 space-y-2">
                        <Link 
                            href="/" 
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium hover:bg-white/10 transition-all duration-300 transform hover:translate-x-2 border border-transparent hover:border-white/20"
                        >
                            <LayoutDashboard className="w-5 h-5 text-blue-300" />
                            Home
                        </Link>
                        
                        {Object.entries(navLinks).map(([title, links]) => (
                            <div key={title} className="pt-3">
                                <div className="flex items-center gap-2 px-4 py-2 mb-2">
                                    <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
                                    <h3 className="text-sm font-bold uppercase text-blue-200 tracking-wider">{title}</h3>
                                </div>
                                <div className="space-y-1">
                                    {links.map((link:any, index:any) =>
                                        link.isHeader ? (
                                            <div key={link.label} className="px-4 pt-3 pb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300/70">{link.label.replace(/—/g, '').trim()}</span>
                                                <div className="border-b border-white/10 mt-1"></div>
                                            </div>
                                        ) : (
                                            <Link 
                                                key={link.href} 
                                                href={link.href} 
                                                className="flex items-center gap-3 pl-8 pr-4 py-3 rounded-xl text-sm font-medium hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:translate-x-2 hover:shadow-lg border border-transparent hover:border-white/20"
                                                style={{ animationDelay: `${index * 100}ms` }}
                                            >
                                                <div className="w-2 h-2 bg-gradient-to-r from-blue-300 to-indigo-400 rounded-full opacity-60"></div>
                                                {link.label}
                                            </Link>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        <div className="pt-4 border-t border-white/10 mt-4">
                            <button 
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}