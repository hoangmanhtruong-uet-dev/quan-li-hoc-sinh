import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "TutorTrack - Nền tảng Quản lý Gia sư",
  description: "Giải pháp theo dõi lịch học, tiến độ và đánh giá dành cho Gia sư chuyên nghiệp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className={`${outfit.variable} font-sans antialiased selection:bg-indigo-500/30`}>
        {children}
      </body>
    </html>
  );
}
