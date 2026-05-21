import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deeprastore | Premium Indian Fashion & Fabrics",
  description: "Redefining Indian luxury through sustainable craftsmanship and timeless design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body min-h-screen bg-bg text-fg">
        {children}
      </body>
    </html>
  );
}
