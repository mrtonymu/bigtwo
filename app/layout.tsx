import React, { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "../styles/mobile-optimizations.css"
import { ToastProvider } from "@/components/toast-provider"
import { DataCleanupProvider } from "@/components/data-cleanup-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "CNFLIX - 免费流媒体播放平台",
  description: "CNFLIX免费流媒体播放平台，海量高清影视资源，每日更新，永久免费在线观看。",
  generator: "CNFLIX",
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
        <ToastProvider />
        <DataCleanupProvider />
      </body>
    </html>
  )
}
