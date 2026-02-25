import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
import { VehicleProvider } from "@/app/context/VehicleContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Panora Auto Connect",
  description: "Professional automotive management platform",
  manifest: "/manifest.json"
};

export const viewport = {
  themeColor: "#0077B6"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <VehicleProvider>
            {children}
          </VehicleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
