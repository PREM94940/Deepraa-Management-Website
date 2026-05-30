// src/app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
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

import { AuthProvider } from "@/context/AuthContext";
import { GlobalClientComponents } from "@/components/GlobalClientComponents";

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
          {/* Preserve global UI elements */}
          {children}
          <GlobalClientComponents />
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
