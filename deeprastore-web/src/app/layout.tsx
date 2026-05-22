import type { Metadata } from "next";
import { Playfair_Display, Poppins } from 'next/font/google';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'Deeprastore | Premium Indian Fashion',
  description: 'Premium sarees, lehengas and custom stitching services',
};

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700', '800'],
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${poppins.variable}`}>
      <body className="font-body min-h-screen bg-bg text-fg">
        {children}
        <FloatingWhatsApp />
        <Analytics />
      </body>
    </html>
  );
}
