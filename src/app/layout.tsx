import type { Metadata } from "next"
import { Space_Grotesk, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Premiere Realty CRM",
  description: "Real estate team management and transaction tracking",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} min-h-screen bg-zinc-950 font-sans antialiased`}
      >
        <div className="flex">
          <Sidebar />
          <div className="flex-1 pl-64">
            <Header />
            <main className="min-h-[calc(100vh-4rem)] p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
