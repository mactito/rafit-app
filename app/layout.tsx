import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RAFIT - Raphi Coaching',
  description: 'First the mind, then the body',
  manifest: '/manifest.json',
  themeColor: '#FF4D8D',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'RAFIT' },
  icons: { icon: '/icon.png', apple: '/apple-touch-icon.png' }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF4D8D" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
          }
        `}} />
      </body>
    </html>
  )
}