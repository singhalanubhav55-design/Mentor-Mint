'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ChatBox from '@/components/ChatBox'
import MentorCard from '@/components/MentorCard'
import { getArchetypeStyle } from '@/lib/ipfs'

export default function ChatPage() {
  const [mentor, setMentor] = useState(null)
  const [tokenId, setTokenId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem('mentorMint_mentor')
    if (raw) {
      const data = JSON.parse(raw)
      setMentor(data)
      setTokenId(data.tokenId)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#030308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  if (!mentor) {
    return (
      <div style={{ minHeight: '100vh', background: '#030308' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="card" style={{ borderRadius: 16, padding: '48px 32px', textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 48, marginBottom: 16, color: '#a0a0c8' }}>◎</div>
            <h2 className="font-orbitron" style={{ fontSize: 18, color: '#f0e6ff', marginBottom: 10 }}>No Mentor Yet</h2>
            <p style={{ fontSize: 14, color: '#a0a0c8', marginBottom: 24, lineHeight: 1.6 }}>
              Create and mint your mentor first to start chatting.
            </p>
            <Link href="/createMentor" className="btn-primary"
              style={{ padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 11, letterSpacing: '0.12em', display: 'inline-block' }}>
              ◈ Create Mentor
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const style = getArchetypeStyle(mentor.archetype)
  const c = style.color
  const mentorInitials = (mentor.name || 'MM').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: '#030308', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, opacity: 0.18, pointerEvents: 'none' }} />

      {/* Ambient color */}
      <div style={{ position: 'fixed', top: 0, right: 0, width: 400, height: 400, borderRadius: '50%', background: c, opacity: 0.04, filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', flex: 1, display: 'flex', maxWidth: 1100, margin: '0 auto', width: '100%', padding: '5.5rem 1.5rem 1.5rem', gap: 20, minHeight: 0 }}>
        {/* Sidebar (desktop) */}
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MentorCard mentor={mentor} tokenId={tokenId} compact />

          {/* Mentor info */}
          <div className="card" style={{ borderRadius: 12, padding: 18, flex: 1 }}>
            <h3 className="font-orbitron" style={{ fontSize: 9, color: '#a0a0c8', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>Your Mentor</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <span className="font-mono-custom" style={{ fontSize: 10, color: '#a0a0c8', display: 'block', marginBottom: 4 }}>Expertise</span>
                <p style={{ fontSize: 12, color: 'rgba(240,230,255,0.55)', lineHeight: 1.5 }}>{mentor.expertise}</p>
              </div>
              <div>
                <span className="font-mono-custom" style={{ fontSize: 10, color: '#a0a0c8', display: 'block', marginBottom: 4 }}>Style</span>
                <p style={{ fontSize: 12, color: 'rgba(240,230,255,0.55)', lineHeight: 1.5 }}>{mentor.adviceStyle}</p>
              </div>
            </div>

            {/* Suggested prompts */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,240,255,0.08)' }}>
              <p className="font-orbitron" style={{ fontSize: 9, color: '#a0a0c8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Try asking</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  'Explain this in simple terms',
                  'Give me a study roadmap',
                  'How do I debug this?',
                  'Motivate me right now',
                ].map((p, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'rgba(74,74,106,0.7)', padding: '6px 8px', borderRadius: 6, background: 'rgba(0,240,255,0.02)', cursor: 'default' }}>
                    ◎ {p}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Link href="/dashboard" className="btn-outline"
            style={{ padding: '10px', borderRadius: 8, textDecoration: 'none', fontSize: 10, letterSpacing: '0.12em', textAlign: 'center', display: 'block' }}>
            → Dashboard
          </Link>
        </div>

        {/* Chat panel */}
        <div className="card" style={{ flex: 1, borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {/* Chat header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(0,240,255,0.1)',
            background: 'linear-gradient(135deg, rgba(0,240,255,0.03), transparent)',
            display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
          }}>
            {/* Avatar with online dot */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div className="font-orbitron" style={{
                width: 40, height: 40, borderRadius: 8,
                background: `${c}14`, border: `1px solid ${c}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: c,
              }}>
                {mentorInitials}
              </div>
              <span style={{
                position: 'absolute', top: -3, right: -3, width: 10, height: 10,
                borderRadius: '50%', background: '#00ff88',
                border: '2px solid #030308', boxShadow: '0 0 6px #00ff88',
              }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-orbitron" style={{ fontSize: 13, fontWeight: 700, color: c, textShadow: `0 0 8px ${c}55` }}>
                {mentor.name}
              </div>
              <div className="font-mono-custom" style={{ fontSize: 10, color: '#a0a0c8' }}>
                {style.emoji} {mentor.archetype} · Level {mentor.level || 1} · Online
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="font-mono-custom" style={{ fontSize: 10, color: '#a0a0c8' }}>Powered by Gemini</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', animation: 'pulse 2s infinite' }} />
            </div>
          </div>

          {/* ChatBox fills remaining space */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ChatBox mentor={mentor} />
          </div>
        </div>
      </div>
    </div>
  )
}