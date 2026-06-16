import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "./_components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Roboto({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDF.ai — Chat with your PDFs",
  description: "Upload PDFs and chat with them using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem> */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} font-heading min-h-svh antialiased`}
      >
        <ClerkProvider>
          <Header />
          {children}
        </ClerkProvider>
      </body>
      {/* </ThemeProvider> */}
    </html>
  );
}
