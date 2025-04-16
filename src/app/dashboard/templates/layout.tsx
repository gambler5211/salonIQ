import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Message Templates - SalonIQ",
  description: "Create and manage WhatsApp message templates for your salon",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ff7b54",
};

export default function TemplatesLayout({ children }: { children: ReactNode }) {
  return children;
} 