import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Personal Schedule Builder',
  description: 'A drag-and-drop schedule builder',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
