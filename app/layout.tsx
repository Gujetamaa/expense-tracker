import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import RootLayoutClient from "@/components/RootLayoutClient";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Finance Tracker",
  description: "A local-first personal finance tracker with expenses, income, and savings goals tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
