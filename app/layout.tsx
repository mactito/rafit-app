import './globals.css'
export const metadata = { title: 'RAFIT' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="bg-[#080808] text-white">{children}</body></html>
}
