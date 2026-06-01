import './globals.css'

export const metadata = {
  title: 'YourFinance.ai — Military Financial Readiness Field Manual',
  description: 'From an AFC®-credentialed military financial counselor. The complete financial readiness system for service members, Guard, and Reservists. Get Warrior Personal Finance — Book 1.',
  keywords: 'military financial readiness, warrior personal finance, AFC, BAH, TSP, SDP, SCRA, military money, veteran finance',
  openGraph: {
    title: 'YourFinance.ai — Military Financial Readiness Field Manual',
    description: 'Your Financial Readiness Starts Here. Not With a Budget App. With a Battle Plan.',
    url: 'https://yourfinance.ai',
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
