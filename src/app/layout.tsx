// src/app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import { WhatsAppConcierge } from "@/components/WhatsAppConcierge";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import dynamic from "next/dynamic";
import { getCurrentTheme } from "@/themes/themeRegistry";

export const metadata: Metadata = {
  title: "Deeprastore | Premium Indian Fashion",
  description: "Premium sarees, lehengas and custom stitching services",
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600"],
});

const EditorialBoutique = dynamic(() => import("@/themes/editorial_boutique/index"));

import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { OperationalShortcut } from "@/components/admin/OperationalShortcut";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = getCurrentTheme();
  
  return (
    <html lang="en" className={`${playfair.variable} ${poppins.variable}`}>
      <body className="font-body min-h-screen bg-bg text-fg">
        <AuthProvider>
          {theme === 'editorial_boutique' ? <EditorialBoutique /> : null}
          {/* Preserve global UI elements */}
          {children}
          <OperationalShortcut />
          <AuthModal />
          <WhatsAppConcierge />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
