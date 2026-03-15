'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import MentorCard from '@/components/MentorCard'
import { connectWallet, getCurrentAccount, getMentorFromChain, getOwnerTokens, levelUpMentor, shortAddress, xpProgressPercent, xpToNextLevel } from '@/lib/contract'

export default function DashboardPage() {
  const [wallet, setWallet] = useState(null)
  const [mentor, setMentor] = useState(null)
  const [tokenId, setTokenId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [leveling, setLeveling] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')
  const [source, setSource] = useState('') // 'chain' or 'local'
  const [levelHistory, setLevelHistory] = useState([])

  // Load mentor: try chain first, fall back to localStorage
  const loadMentor = useCallback(async (address) => {
    setLoading(true)
    setError('')
    try {
      const tokens = await getOwnerTokens(address)
      if (tokens.length > 0) {
        const tid = tokens[tokens.length - 1]
        setTokenId(tid)
        const data = await getMentorFromChain(tid)
        setMentor(data)
        setLevelHistory(data.levelHistory || [])
        setSource('chain')
        // Sync to localStorage
        const stored = JSON.parse(localStorage.getItem('mentorMint_mentor') || '{}')
        localStorage.setItem('mentorMint_mentor', JSON.stringify({ ...stored, ...data, tokenId: tid }))
      } else {
        throw new Error('No on-chain tokens')
      }
    } catch {
      // Fall back to localStorage
      const raw = localStorage.getItem('mentorMint_mentor')
      if (raw) {
        const local = JSON.parse(raw)
        setMentor(local)
        setTokenId(local.tokenId)
        setLevelHistory(local.levelHistory || [{ level: 1, timestamp: Math.floor((local.mintedAt || Date.now()) / 1000) }])
        setSource('local')
      } else {
        setMentor(null)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const init = async () => {
      const acc = await getCurrentAccount()
      if (acc) {
        setWallet(acc)
        await loadMentor(acc)
      } else {
        // No wallet - just load from localStorage
        const raw = localStorage.getItem('mentorMint_mentor')
        if (raw) {
          const local = JSON.parse(raw)
          setMentor(local)
          setTokenId(local.tokenId)
          setLevelHistory(local.levelHistory || [{ level: 1, timestamp: Math.floor((local.mintedAt || Date.now()) / 1000) }])
          setSource('local')
        }
        setLoading(false)
      }
    }
    init()

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accs) => {
        setWallet(accs[0] || null)
        if (accs[0]) loadMentor(accs[0])
      })
    }
  }, [loadMentor])

  async function handleConnect() {
    try {
      const addr = await connectWallet()
      setWallet(addr)
      await loadMentor(addr)
    } catch (err) {
      setError(err.message)
    }
  }

  // Complete Task → levelUp on-chain
  async function handleLevelUp() {
    if (!tokenId) {
      setError('No token ID. Please mint your mentor first.')
      return
    }
    setLeveling(true)
    setTxHash('')
    setError('')

    try {
      const hash = await levelUpMentor(tokenId)
      setTxHash(hash)
      // Reload from chain after 3s
      setTimeout(() => { if (wallet) loadMentor(wallet) }, 3000)
    } catch (err) {
      // Demo mode: simulate locally
      const raw = localStorage.getItem('mentorMint_mentor')
      if (raw) {
        const local = JSON.parse(raw)
        const newXp = (local.xp || 0) + 100
        const oldLevel = local.level || 1
        const newLevel = newXp >= oldLevel * 300 ? oldLevel + 1 : oldLevel
        const newHistory = newLevel > oldLevel
          ? [...(local.levelHistory || []), { level: newLevel, timestamp: Math.floor(Date.now() / 1000) }]
          : (local.levelHistory || [])
        const updated = { ...local, xp: newXp, level: newLevel, levelHistory: newHistory }
        localStorage.setItem('mentorMint_mentor', JSON.stringify(updated))
        setMentor(updated)
        setLevelHistory(newHistory)
        if (newLevel > oldLevel) {
          setError('')
        }
      }
      setError(`Demo mode: XP added locally. Deploy contract for on-chain tracking. (${err.message?.slice(0, 60)})`)
    }
    setLeveling(false)
  }

  function fmtDate(ts) {
    return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const progress = mentor ? xpProgressPercent(mentor.level || 1, mentor.xp || 0) : 0
  const toNext = mentor ? xpToNextLevel(mentor.level || 1, mentor.xp || 0) : 300

  return (
    <div style={{ minHeight: '100vh', background: '#030308' }}>
      <Navbar />
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, opacity: 0.25, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '7rem 1.5rem 4rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <h1 className="font-orbitron" style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', fontWeight: 900, color: '#f0e6ff' }}>
              MENTOR <span style={{ color: '#00f0ff' }}>DASHBOARD</span>
            </h1>
            <p className="font-mono-custom" style={{ fontSize: 11, color: '#a0a0c8', marginTop: 4 }}>
              {wallet ? shortAddress(wallet) : 'Connect wallet to sync blockchain data'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {!wallet && (
              <button onClick={handleConnect} className="btn-outline" style={{ padding: '8px 18px', borderRadius: 8, fontSize: 10 }}>
                Connect Wallet
              </button>
            )}
            {source === 'local' && wallet && (
              <button onClick={() => loadMentor(wallet)} className="btn-outline" style={{ padding: '8px 18px', borderRadius: 8, fontSize: 10 }}>
                ↺ Sync Chain
              </button>
            )}
          </div>
        </div>

        {/* Data source indicator */}
        {source && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: source === 'chain' ? '#00f0ff' : '#7b2fff', boxShadow: source === 'chain' ? '0 0 6px #00f0ff' : '0 0 6px #7b2fff' }} />
            <span className="font-mono-custom" style={{ fontSize: 10, color: '#a0a0c8' }}>
              {source === 'chain' ? 'Live blockchain data' : 'Local data — connect wallet to sync chain'}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card" style={{ borderRadius: 8, padding: '10px 16px', marginBottom: 16, borderColor: 'rgba(255,149,0,0.3)' }}>
            <p className="font-mono-custom" style={{ fontSize: 11, color: '#ff9500' }}>⚠ {error}</p>
          </div>
        )}

        {/* TX success */}
        {txHash && (
          <div className="card" style={{ borderRadius: 8, padding: '10px 16px', marginBottom: 16, borderColor: 'rgba(0,240,255,0.3)' }}>
            <p className="font-mono-custom" style={{ fontSize: 11, color: '#00f0ff' }}>
              ✓ Tx:{' '}
              <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff' }}>
                {txHash.slice(0, 18)}...
              </a>
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="card" style={{ borderRadius: 12, padding: '64px 32px', textAlign: 'center' }}>
            <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
            <p className="font-mono-custom" style={{ fontSize: 12, color: '#a0a0c8' }}>Loading mentor data...</p>
          </div>
        )}

        {/* No mentor */}
        {!loading && !mentor && (
          <div className="card" style={{ borderRadius: 16, padding: '64px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16, color: '#a0a0c8' }}>◈</div>
            <h3 className="font-orbitron" style={{ fontSize: 16, color: '#f0e6ff', marginBottom: 8 }}>No Mentor Found</h3>
            <p style={{ fontSize: 14, color: '#a0a0c8', marginBottom: 24 }}>You haven't minted a mentor yet.</p>
            <Link href="/createMentor" className="btn-primary" style={{ padding: '12px 32px', borderRadius: 8, textDecoration: 'none', fontSize: 11, letterSpacing: '0.12em', display: 'inline-block' }}>
              ◈ Create Your Mentor
            </Link>
          </div>
        )}

        {/* Dashboard content */}
        {!loading && mentor && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 20 }}>
            {/* LEFT column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <MentorCard mentor={mentor} tokenId={tokenId} />

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Level', value: mentor.level || 1, color: '#7b2fff' },
                  { label: 'Total XP', value: mentor.xp || 0, color: '#00f0ff' },
                  { label: 'Tasks Done', value: Math.floor((mentor.xp || 0) / 100), color: '#ff2d78' },
                ].map((s, i) => (
                  <div key={i} className="card" style={{ borderRadius: 10, padding: '16px', textAlign: 'center', borderColor: `${s.color}20` }}>
                    <div className="font-orbitron" style={{ fontSize: 28, fontWeight: 900, color: s.color, textShadow: `0 0 10px ${s.color}55` }}>{s.value}</div>
                    <div className="font-orbitron" style={{ fontSize: 9, color: '#a0a0c8', letterSpacing: '0.12em', marginTop: 4, textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* XP progress */}
              <div className="card" style={{ borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="font-orbitron" style={{ fontSize: 9, color: '#a0a0c8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Progress to Next Level</span>
                  <span className="font-mono-custom" style={{ fontSize: 11, color: '#00f0ff' }}>{progress}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 9999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span className="font-mono-custom" style={{ fontSize: 10, color: '#a0a0c8' }}>Level {mentor.level || 1}</span>
                  <span className="font-mono-custom" style={{ fontSize: 10, color: '#a0a0c8' }}>{toNext} XP to Level {(mentor.level || 1) + 1}</span>
                </div>
              </div>

              {/* Complete Task button */}
              <div className="card border-animated" style={{ borderRadius: 12, padding: 24 }}>
                <h3 className="font-orbitron" style={{ fontSize: 11, letterSpacing: '0.12em', color: '#f0e6ff', marginBottom: 8, textTransform: 'uppercase' }}>Complete Learning Task</h3>
                <p style={{ fontSize: 13, color: '#a0a0c8', lineHeight: 1.6, marginBottom: 16 }}>
                  Mark a task complete to earn <span style={{ color: '#00f0ff' }}>+100 XP</span>. Calls{' '}
                  <code style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#7b2fff', background: 'rgba(123,47,255,0.1)', padding: '1px 6px', borderRadius: 4 }}>levelUp(tokenId)</code>{' '}
                  on the smart contract.
                </p>
                <button onClick={handleLevelUp} disabled={leveling} className="btn-primary"
                  style={{ width: '100%', padding: '14px', borderRadius: 10, fontSize: 11, letterSpacing: '0.12em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {leveling ? (
                    <><span className="spinner" style={{ width: 14, height: 14 }} /> Recording on blockchain...</>
                  ) : '◆ Complete Task (+100 XP)'}
                </button>
              </div>
            </div>

            {/* RIGHT column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Level history */}
              <div className="card" style={{ borderRadius: 12, padding: 20 }}>
                <h3 className="font-orbitron" style={{ fontSize: 9, letterSpacing: '0.15em', color: '#a0a0c8', textTransform: 'uppercase', marginBottom: 16 }}>Evolution History</h3>
                {levelHistory.length === 0 ? (
                  <p className="font-mono-custom" style={{ fontSize: 11, color: '#a0a0c8' }}>Complete tasks to level up!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {levelHistory.map((ev, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="font-orbitron" style={{
                          width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                          background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)',
                          color: '#00f0ff',
                        }}>
                          {ev.level}
                        </div>
                        <div>
                          <div className="font-orbitron" style={{ fontSize: 10, color: '#f0e6ff', letterSpacing: '0.08em' }}>Level {ev.level}</div>
                          <div className="font-mono-custom" style={{ fontSize: 10, color: '#a0a0c8' }}>{fmtDate(ev.timestamp)}</div>
                        </div>
                        {i === levelHistory.length - 1 && (
                          <span className="font-mono-custom" style={{ marginLeft: 'auto', fontSize: 9, color: '#00f0ff' }}>now</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="card" style={{ borderRadius: 12, padding: 20 }}>
                <h3 className="font-orbitron" style={{ fontSize: 9, letterSpacing: '0.15em', color: '#a0a0c8', textTransform: 'uppercase', marginBottom: 14 }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { href: '/chat', label: `Chat with ${mentor.name?.split(' ')[0] || 'Mentor'}`, color: '#00f0ff', icon: '◎' },
                    { href: '/createMentor', label: 'Create Another Mentor', color: '#7b2fff', icon: '◈' },
                  ].map((a, i) => (
                    <Link key={i} href={a.href} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderRadius: 8, textDecoration: 'none', fontSize: 13,
                      background: `${a.color}06`, border: `1px solid ${a.color}15`,
                      color: '#a0a0c8', transition: 'all 0.2s',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#f0e6ff'; e.currentTarget.style.borderColor = `${a.color}35` }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#a0a0c8'; e.currentTarget.style.borderColor = `${a.color}15` }}
                    >
                      <span style={{ color: a.color }}>{a.icon}</span> {a.label}
                    </Link>
                  ))}
                  {tokenId && (
                    <a href={`https://sepolia.etherscan.io/token/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}?a=${tokenId}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, textDecoration: 'none', fontSize: 13, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#a0a0c8' }}>
                      <span>◆</span> View on Etherscan
                    </a>
                  )}
                </div>
              </div>

              {/* Mentor info */}
              <div className="card" style={{ borderRadius: 12, padding: 20 }}>
                <h3 className="font-orbitron" style={{ fontSize: 9, letterSpacing: '0.15em', color: '#a0a0c8', textTransform: 'uppercase', marginBottom: 14 }}>About Your Mentor</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Personality', value: mentor.personality },
                    { label: 'Advice Style', value: mentor.adviceStyle },
                  ].filter(x => x.value).map((item, i) => (
                    <div key={i}>
                      <span className="font-mono-custom" style={{ fontSize: 10, color: '#a0a0c8', display: 'block', marginBottom: 4 }}>{item.label}</span>
                      <p style={{ fontSize: 12, color: '#c8c0f0', lineHeight: 1.6 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}