import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlatSplit — Shared Retro Expense Manager',
  description: 'Classic single-page expense manager for flatmates.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
