import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RAFIT - Full Luxury Real Supabase',
  description: 'Coach + Client App Real Supabase - Modular Full Luxury',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className="bg-[#080808] text-white antialiased">{children}</body>
    </html>
  )
}
