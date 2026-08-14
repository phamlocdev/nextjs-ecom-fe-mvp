import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'DynamoDB MVP Storefront and Admin',
  description: 'Customer catalog and admin console for the DynamoDB MVP project',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='vi' className={`${geistMono.variable} h-full antialiased`}>
      <body className='min-h-full bg-background text-foreground'>
        {children}
        <Toaster position='top-right' />
      </body>
    </html>
  )
}
