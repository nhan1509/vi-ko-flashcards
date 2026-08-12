import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Noto_Sans_KR } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const viFont = Be_Vietnam_Pro({
  variable: "--font-vi",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const koFont = Noto_Sans_KR({
  variable: "--font-ko",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Flashcard Việt–Hàn",
  description: "Học từ vựng Việt–Hàn với SRS trên điện thoại",
  applicationName: "Flashcard Việt–Hàn",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Việt–Hàn",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f6b5c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${viFont.variable} ${koFont.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
