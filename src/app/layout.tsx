import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Animify",
  description: "Animify - Dynamic Music Visualizer",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head></head>
      <body>{children}</body>
    </html>
  );
}
