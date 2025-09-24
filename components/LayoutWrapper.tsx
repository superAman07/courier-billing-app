'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from './Footer';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noHeaderRoutes = ['/login'];

  const showHeader = !noHeaderRoutes.includes(pathname);

  return (
    <>
      {showHeader && <Header />}
      <main>{children}</main>
      <Footer/>
    </>
  );
}