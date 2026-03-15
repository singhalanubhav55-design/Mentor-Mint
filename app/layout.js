import './globals.css'

export const metadata = {
  title: 'MentorMint — Mint Your AI Mentor as an NFT',
  description: 'Generate a personalized AI mentor, mint it as an NFT on Ethereum Sepolia, chat with it, and level it up.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ background: '#030308', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
