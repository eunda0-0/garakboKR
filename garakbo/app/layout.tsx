import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '가락보 편집기',
  description: '3소박 4박 타악 가락보 편집기',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
