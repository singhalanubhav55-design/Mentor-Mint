'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { connectWallet, getCurrentAccount, shortAddress } from '@/lib/contract'

export default function Navbar() {
  const [account, setAccount] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Check if already connected
    getCurrentAccount().then((acc) => { if (acc) setAccount(acc) })

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0] || null)
      })
    }

    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleConnect() {
    setConnecting(true)
    try {
      const addr = await connectWallet()
      setAccount(addr)
    } catch (err) {
      alert(err.message)
    } finally {
      setConnecting(false)
    }
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/createMentor', label: 'Create' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/chat', label: 'Chat' },
  ]

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(3,3,8,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,240,255,0.1)' : 'none',
        transition: 'all 0.4s',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #00f0ff, #7b2fff)', borderRadius: 4, transform: 'rotate(45deg)' }} />
            <div style={{ position: 'absolute', inset: 4, background: '#030308', borderRadius: 2, transform: 'rotate(45deg)' }} />
            <div style={{ position: 'absolute', inset: 8, background: 'linear-gradient(135deg, #00f0ff, #7b2fff)', borderRadius: 1, transform: 'rotate(45deg)', opacity: 0.7 }} />
          </div>
          <span className="font-orbitron" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', color: '#f0e6ff' }}>
            MENTOR<span style={{ color: '#00f0ff' }}>MINT</span>
          </span>
        </Link>

        {/* Links */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href}
              className="font-orbitron"
              style={{ fontSize: 10, letterSpacing: '0.15em', color: '#a0a0c8', textDecoration: 'none', textTransform: 'uppercase', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#00f0ff'}
              onMouseLeave={e => e.target.style.color = '#a0a0c8'}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Wallet Button */}
        <button onClick={handleConnect} disabled={connecting} className="btn-outline"
          style={{ padding: '8px 20px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: account ? '#00f0ff' : '#a0a0c8', boxShadow: account ? '0 0 6px #00f0ff' : 'none', flexShrink: 0 }} />
          {connecting ? 'Connecting...' : account ? shortAddress(account) : 'Connect Wallet'}
        </button>
      </div>
    </nav>
  )
}