import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from './components/Sidebar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Máquina de Criativos — Seazone',
  description: 'Gerador de criativos profissionais para a Seazone',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="flex h-screen overflow-hidden bg-[#00143D] text-white">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#00143D]">
          {children}
        </main>
      </body>
    </html>
  );
}
