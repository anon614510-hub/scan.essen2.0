import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FridgeForager",
  description: "Generate recipes from your fridge contents using AI.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FridgeForager",
  },
  icons: {
    apple: "/icons/icon.png",
  },
};

export const viewport = {
  themeColor: "#34D399",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={clsx(inter.className, "antialiased min-h-screen bg-background text-gray-900")}>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          {children}
        </main>
      </body>
    </html>
  );
}
