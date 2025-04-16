import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Dashboard - SalonIQ",
  description: "Manage your salon clients and automated messaging",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ff7b54",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
} 