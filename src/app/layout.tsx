import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EVENT } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${EVENT.shortName} | Register`,
  description: `${EVENT.name} — ${EVENT.tagline}. Register for the 5K Walk/Jog on ${EVENT.date}.`,
  openGraph: {
    title: EVENT.name,
    description: EVENT.tagline,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1b4cf5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
