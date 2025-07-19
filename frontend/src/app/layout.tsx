import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Connecting Future',
  description: 'Created on 19th',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
