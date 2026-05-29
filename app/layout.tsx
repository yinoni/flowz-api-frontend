import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "./components/StoreProvider";
import { ClientLayoutWrapper } from "./components/ClientLayoutWrapper";
import { WebSocketProvider } from "./components/WebSocketProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "FlowState | API Flow Builder",
  description: "Visual API flow builder and test executor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="bg-background text-on-background h-screen flex flex-col overflow-hidden font-body-md text-body-md">
        <StoreProvider>
          <WebSocketProvider>
            <ClientLayoutWrapper>
              {children}
            </ClientLayoutWrapper>
          </WebSocketProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
