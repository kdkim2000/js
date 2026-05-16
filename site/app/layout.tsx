import type { Metadata } from "next";
import { Sora, Roboto_Mono } from "next/font/google";
import "./globals.css";
import GNB from "@/components/GNB";

const sora = Sora({ variable: "--font-sora", subsets: ["latin"], display: "swap" });
const robotoMono = Roboto_Mono({ variable: "--font-roboto-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "학습 크롤러",
  description: "URL을 등록하면 임의의 문서/튜토리얼 사이트를 크롤링하고 검색할 수 있는 로컬 학습 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sora.variable} ${robotoMono.variable} h-full`}>
      <body className="h-full bg-canvas text-gray-900">
        <GNB />
        {children}
      </body>
    </html>
  );
}
