import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DashboardLayout } from "@/components/DashboardLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduVision Dashboard",
  description: "AI-based Attendance System for Rural Schools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isServiceRoleMissing = !process.env.SUPABASE_SERVICE_ROLE_KEY;

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50`}>
        {isServiceRoleMissing && (
          <div className="bg-amber-600 text-white px-4 py-2.5 text-xs sm:text-sm font-medium text-center sticky top-0 z-50 shadow-md flex items-center justify-center gap-2">
            <span className="font-bold">⚠️ CRITICAL CONFIGURATION ALERT:</span>
            <span><code>SUPABASE_SERVICE_ROLE_KEY</code> is unset in this deployment. Admin write actions and audit logging are disabled until configured.</span>
          </div>
        )}
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
