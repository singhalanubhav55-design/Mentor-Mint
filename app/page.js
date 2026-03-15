'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const features = [
    { icon: '◈', color: '#00f0ff', title: 'AI-Generated Mentor', desc: 'Describe your needs. Gemini AI builds a unique mentor profile with custom expertise and personality.' },
    { icon: '◆', color: '#7b2fff', title: 'Mint as NFT', desc: 'Your mentor is an ERC-721 NFT on Ethereum Sepolia. Permanent, verifiable, truly yours.' },
    { icon: '◎', color: '#ff2d78', title: 'Chat in Real-Time', desc: 'Have live conversations with your AI mentor. Get personalized guidance any time.' },
    { icon: '△', color: '#00ff88', title: 'Level Up On-Chain', desc: 'Complete tasks to earn XP. Your mentor evolves on the blockchain as you grow.' },
  ]

  const steps = [
    { n: '01', label: 'Connect Wallet', desc: 'Connect MetaMask to Sepolia testnet', c: '#00f0ff' },
    { n: '02', label: 'Describe Needs', desc: 'Tell AI what you want to learn', c: '#7b2fff' },
    { n: '03', label: 'AI Generates', desc: 'Gemini crafts your unique mentor', c: '#ff2d78' },
    { n: '04', label: 'Mint NFT', desc: 'Pay gas, record on Ethereum', c: '#00f0ff' },
    { n: '05', label: 'Chat and Learn', desc: 'Real conversations with your mentor', c: '#7b2fff' },
    { n: '06', label: 'Level Up', desc: 'Complete tasks, earn XP on-chain', c: '#ff2d78' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#030308' }}>
      <Navbar />

      {/* Grid bg */}
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />

      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem 4rem' }}>
        <div style={{ maxWidth: 900, width: '100%', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, marginBottom: 32, background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00f0ff', boxShadow: '0 0 6px #00f0ff', animation: 'pulse 2s infinite' }} />
            <span className="font-mono-custom" style={{ fontSize: 11, color: '#00f0ff' }}>Live on Ethereum Sepolia Testnet</span>
          </div>

          {/* Headline */}
          <h1 className="font-orbitron" style={{ lineHeight: 1.05, marginBottom: 24 }}>
            <span style={{ display: 'block', fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', fontWeight: 900, color: '#f0e6ff' }}>MINT YOUR</span>
            <span style={{ display: 'block', fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', fontWeight: 900, color: '#00f0ff', textShadow: '0 0 30px rgba(0,240,255,0.5)' }}>AI MENTOR</span>
            <span style={{ display: 'block', fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', fontWeight: 900, color: 'rgba(240,230,255,0.25)', marginTop: 8 }}>AS AN NFT</span>
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(240,230,255,0.5)', maxWidth: 600, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Generate a personalized AI mentor powered by Gemini, mint it as an NFT on Ethereum, chat with it, and level it up as you learn.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/createMentor" className="btn-primary" style={{ padding: '14px 36px', borderRadius: 8, textDecoration: 'none', fontSize: 11, letterSpacing: '0.15em' }}>
              ◈ Create Your Mentor
            </Link>
            <Link href="/dashboard" className="btn-outline" style={{ padding: '14px 36px', borderRadius: 8, textDecoration: 'none', fontSize: 11, letterSpacing: '0.15em' }}>
              ◎ View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ position: 'relative', padding: '6rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <h2 className="font-orbitron" style={{ textAlign: 'center', fontSize: 'clamp(1.2rem,3vw,2rem)', fontWeight: 700, color: '#f0e6ff', marginBottom: '3rem', letterSpacing: '0.1em' }}>
          HOW IT <span style={{ color: '#00f0ff' }}>WORKS</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} className="card" style={{ borderRadius: 12, padding: 24, borderColor: `${f.color}20` }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: `${f.color}12`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: f.color, marginBottom: 16 }}>
                {f.icon}
              </div>
              <h3 className="font-orbitron" style={{ fontSize: 11, letterSpacing: '0.1em', color: f.color, marginBottom: 8, textTransform: 'uppercase' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(240,230,255,0.5)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STEPS */}
      <section style={{ padding: '4rem 1.5rem 8rem', maxWidth: 800, margin: '0 auto' }}>
        <h2 className="font-orbitron" style={{ textAlign: 'center', fontSize: 'clamp(1rem,3vw,1.8rem)', fontWeight: 700, color: '#f0e6ff', marginBottom: '3rem', letterSpacing: '0.1em' }}>
          THE <span style={{ color: '#7b2fff' }}>JOURNEY</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {steps.map((s, i) => (
            <div key={i} className="card" style={{ borderRadius: 10, padding: 20, borderColor: `${s.c}20`, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div className="font-orbitron" style={{ fontSize: 22, fontWeight: 900, color: s.c, opacity: 0.5, flexShrink: 0, lineHeight: 1 }}>{s.n}</div>
              <div>
                <div className="font-orbitron" style={{ fontSize: 10, color: s.c, letterSpacing: '0.12em', marginBottom: 4, textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ fontSize: 13, color: 'rgba(240,230,255,0.45)' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(0,240,255,0.08)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <span className="font-orbitron" style={{ fontSize: 10, color: '#a0a0c8', letterSpacing: '0.15em' }}>
          MENTORMINT · WEB3 + AI · ETHEREUM SEPOLIA
        </span>
      </footer>
    </div>
  )
}