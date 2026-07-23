import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "InsightPilot | AI BI Assistant", description: "AI Business Intelligence portfolio demo" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
