import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import clsx from "clsx";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

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

export default async function RootLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // Ensure that the incoming `locale` is valid
    if (!['en', 'es'].includes(locale)) {
        notFound();
    }

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    return (
        <html lang={locale}>
            <head>
                {/* Camera and media permissions hints for mobile browsers */}
                <meta httpEquiv="Permissions-Policy" content="camera=*, microphone=*" />
            </head>
            <body className={clsx(inter.className, "antialiased min-h-screen bg-black")}>
                <NextIntlClientProvider messages={messages}>
                    {children}
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
