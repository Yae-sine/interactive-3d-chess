import type { Metadata } from 'next'
import { Space_Grotesk, Fraunces, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
  preload: false,
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: 'Chess Master 3D',
  description: 'Interactive 3D Chess with AI coaching, blunder detection, and learning mode',
  generator: 'v0.app',
  icons: {
    icon: ['/favicon1.ico', '/chesslogo.jpg'],
    apple: '/chesslogo.png',
    shortcut: '/chesslogo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${fraunces.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}