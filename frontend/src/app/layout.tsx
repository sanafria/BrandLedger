import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DemoToolbar } from '@/components/layout/DemoToolbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brand Ledger — Policy Library & Brand Passport',
  description: 'Enterprise brand governance platform enforcing deterministic rule checks and verifiable source evidence. "No receipt, no flag."',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <DemoToolbar />
        <Footer />
      </body>
    </html>
  );
}
