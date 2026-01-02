import type { Metadata, Viewport } from "next";
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
    statusBarStyle: "black-translucent",
    title: "FridgeForager",
  },
  icons: {
    apple: "/icons/icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Camera and media permissions hints for mobile browsers */}
        <meta httpEquiv="Permissions-Policy" content="camera=*, microphone=*" />
      </head>
      <body className={clsx(inter.className, "antialiased min-h-screen bg-black")}>
        {children}
      </body>
    </html>
  );
}
