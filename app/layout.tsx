import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/contexts/SocketContext";
import { VideoCallProvider } from "@/contexts/VideoCallContext";
import IncomingCallNotification from "@/components/IncomingCallNotification";
import VideoCallInterface from "@/components/VideoCallInterface";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skill Swap",
  description: "Connect and learn new skills together",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SocketProvider>
          <VideoCallProvider>
            {children}
            <IncomingCallNotification />
            <VideoCallInterface />
          </VideoCallProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
