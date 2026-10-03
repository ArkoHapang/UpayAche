import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AIChatWidget from "@/components/chat/AIChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UpayAche — AI-Powered MFS Risk & Scam Intelligence",
  description: "See the risk. Understand the reason. Investigate the network. Modern MFS financial crime intelligence platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <AIChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}

