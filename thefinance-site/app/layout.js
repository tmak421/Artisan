import './globals.css'

export const metadata = {
  title: 'TheFinance.ai — Institutional Bitcoin Intelligence',
  description: 'The Regulatory Intelligence Platform for government contractors, DoD program managers, defense firms, and institutional clients. GENIUS Act, CLARITY Act, Strategic Bitcoin Reserve, DTCC — tracked and analyzed through the Softwar and Cantillon lens.',
  keywords: 'institutional bitcoin, regulatory intelligence, CLARITY Act, GENIUS Act, Strategic Bitcoin Reserve, DTCC, Softwar thesis, Cantillon Effect, DoD bitcoin, defense contractors',
  openGraph: {
    title: 'TheFinance.ai — Institutional Bitcoin Intelligence',
    description: 'The regulatory and monetary intelligence platform for institutional decision-makers. Bitcoin-only. Softwar-grounded. Cantillon-aware.',
    url: 'https://thefinance.ai',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
