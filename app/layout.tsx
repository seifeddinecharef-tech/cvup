import type { Metadata } from "next";
import { Cairo, Geist, Geist_Mono, Lateef, Tajawal } from "next/font/google";
import "./globals.css";
import "./hero-ux.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lateef = Lateef({
  variable: "--font-lateef",
  subsets: ["arabic"],
  weight: "400",
});

const cairo = Cairo({ variable: "--font-arabic-heading", subsets: ["arabic"], weight: ["600", "700"] });
const tajawal = Tajawal({ variable: "--font-arabic-body", subsets: ["arabic"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "CVUp | Votre expérience, mieux présentée",
  description: "CVUp helps job seekers create professional, ATS-friendly CVs and Cover Letters based on their real experience and goals.",
  icons: { icon: "/brand/cvup-logo.png", apple: "/brand/cvup-logo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${lateef.variable} ${cairo.variable} ${tajawal.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
