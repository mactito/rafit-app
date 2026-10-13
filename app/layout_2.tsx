
import './globals.css'
import type { Metadata, Viewport } from 'next'
export const metadata: Metadata = {
  title: 'RAFIT - IFBB PRO Coaching',
  description: 'Allenamento strategico e supporto alimentare - by Raphaela Costa',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'RAFIT' }
}
export const viewport: Viewport = { themeColor: '#FF4D8D', width: 'device-width', initialScale: 1, maximumScale: 1 }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#080808]">{children}</body>
    </html>
  )
}
