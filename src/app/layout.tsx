import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { dir, lang, t } from "@/i18n";
import "./globals.css";

const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${t.appName} | ${t.appTagline}`,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={lang} dir={dir}>
      <body className={`${arabic.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
