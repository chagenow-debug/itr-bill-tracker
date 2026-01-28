import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITR Bill Tracker",
  description: "Iowa General Assembly bill tracker for Iowans for Tax Relief",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
