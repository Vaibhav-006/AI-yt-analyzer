import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";
import PreferencesButton from "../components/PreferencesButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NexG AI",
  description: "A modern AI assistant powered by Next Generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900`}>
        <ThemeProvider>
          {children}
          <PreferencesButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
