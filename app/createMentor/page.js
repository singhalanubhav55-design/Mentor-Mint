'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import MentorCard from '@/components/MentorCard'
import { connectWallet, getCurrentAccount, mintMentorNFT } from '@/lib/contract'

const SUGGESTIONS = [
  'Help with Data Structures and Algorithms and competitive programming',
  'Guide me through web development with React and Node.js',
  'I need help with mathematics and machine learning basics',
  'Support for operating systems and computer networks',
  'Career guidance and interview preparation for placements',
  'Motivate me and help me manage my time better',
]

export default function CreateMentorPage() {
  const router = useRouter()
  const [step, setStep] = useState('input') // input | generating | preview | minting | success
  const [needs, setNeeds] = useState('')
  const [mentor, setMentor] = useState(null)
  const [tokenURI, setTokenURI] = useState('')
  const [mintResult, setMintResult] = useState(null)
  const [error, setError] = useState('')
  const [wallet, setWallet] = useState(null)

  useEffect(() => {
    getCurrentAccount().then((acc) => { if (acc) setWallet(acc) })
  }, [])

  // ---- Step 1: Generate mentor via Gemini ----
  async function handleGenerate() {
    if (needs.trim().length < 8) {
      setError('Please write at least 8 characters describing your needs.')
      return
    }
    setError('')
    setStep('generating')

    try {
      const res = await fetch('/api/generateMentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentNeeds: needs }),
      })

      let data
      try {
        data = await res.json()
      } catch {
        throw new Error('Server error. Make sure GEMINI_API_KEY is set in .env.local')
      }

      if (!data.success) throw new Error(data.error || 'Generation failed')

      setMentor(data.mentor)
      setTokenURI(data.tokenURI)
      setStep('preview')
    } catch (err) {
      setError(err.message)
      setStep('input')
    }
  }

  // ---- Step 2: Mint NFT on Sepolia ----
  async function handleMint() {
    // Connect wallet if not connected
    if (!wallet) {
      try {
        const addr = await connectWallet()
        setWallet(addr)
      } catch (err) {
        setError('Connect your MetaMask wallet first. Make sure you have Sepolia ETH.')
        return
      }
    }

    setStep('minting')
    setError('')

    try {
      const result = await mintMentorNFT({
        name: mentor.name,
        expertise: mentor.expertise,
        personality: mentor.personality,
        adviceStyle: mentor.adviceStyle,
        tokenURI,
      })

      // Save to localStorage for dashboard and chat
      const stored = {
        ...mentor,
        tokenId: result.tokenId,
        txHash: result.txHash,
        level: 1,
        xp: 0,
        mintedAt: Date.now(),
        levelHistory: [{ level: 1, timestamp: Math.floor(Date.now() / 1000) }],
      }
      localStorage.setItem('mentorMint_mentor', JSON.stringify(stored))

      setMintResult(result)
      setStep('success')
    } catch (err) {
      // Simulate for demo if contract not deployed
      const fallback = {
        ...mentor,
        tokenId: Math.floor(Math.random() * 1000) + 1,
        txHash: '0xdemo_' + Math.random().toString(36).slice(2),
        level: 1,
        xp: 0,
        mintedAt: Date.now(),
        levelHistory: [{ level: 1, timestamp: Math.floor(Date.now() / 1000) }],
      }
      localStorage.setItem('mentorMint_mentor', JSON.stringify(fallback))
      setMintResult({ tokenId: fallback.tokenId, txHash: fallback.txHash, demo: true })
      setStep('success')
      setError('Contract not deployed yet — saved in demo mode. Deploy MentorNFT.sol to enable real minting.')
    }
  }

  // ---- UI helpers ----
  const stepIndex = { input: 0, generating: 1, preview: 1, minting: 2, success: 2 }[step] || 0

  function StepDot({ n, label, active }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="font-orbitron" style={{
          width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, transition: 'all 0.4s',
          background: active ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.03)',
          border: active ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.1)',
          color: active ? '#00f0ff' : '#a0a0c8',
        }}>
          {n}
        </div>
        <span className="font-orbitron" style={{ fontSize: 9, letterSpacing: '0.12em', color: active ? '#00f0ff' : '#a0a0c8', textTransform: 'uppercase' }}>{label}</span>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030308' }}>
      <Navbar />
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, opacity: 0.25, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto', padding: '7rem 1.5rem 4rem' }}>
        {/* Page heading */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 className="font-orbitron" style={{ fontSize: 'clamp(1.4rem,4vw,2.2rem)', fontWeight: 900, color: '#f0e6ff', marginBottom: 8 }}>
            {step === 'input' && <>DESCRIBE YOUR <span style={{ color: '#7b2fff' }}>NEEDS</span></>}
            {step === 'generating' && <>GENERATING YOUR <span style={{ color: '#00f0ff' }}>MENTOR</span></>}
            {(step === 'preview' || step === 'minting') && <>YOUR MENTOR <span style={{ color: '#00f0ff' }}>PREVIEW</span></>}
            {step === 'success' && <>MENTOR <span style={{ color: '#ff2d78' }}>MINTED!</span></>}
          </h1>
          <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, transparent, #7b2fff, transparent)', margin: '0 auto' }} />
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, alignItems: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
          <StepDot n="1" label="Describe" active={stepIndex >= 0} />
          <div style={{ width: 32, height: 1, background: 'rgba(0,240,255,0.2)' }} />
          <StepDot n="2" label="Generate" active={stepIndex >= 1} />
          <div style={{ width: 32, height: 1, background: 'rgba(0,240,255,0.2)' }} />
          <StepDot n="3" label="Mint" active={stepIndex >= 2} />
        </div>

        {/* Error banner */}
        {error && (
          <div className="card" style={{ borderRadius: 8, padding: '12px 16px', marginBottom: 20, borderColor: 'rgba(255,45,120,0.3)' }}>
            <p className="font-mono-custom" style={{ fontSize: 12, color: '#ff2d78' }}>⚠ {error}</p>
          </div>
        )}

        {/* ===== INPUT STEP ===== */}
        {step === 'input' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ borderRadius: 12, padding: 24 }}>
              <label className="font-orbitron" style={{ display: 'block', fontSize: 9, letterSpacing: '0.15em', color: '#a0a0c8', textTransform: 'uppercase', marginBottom: 12 }}>
                What do you need help with?
              </label>
              <textarea
                value={needs}
                onChange={(e) => setNeeds(e.target.value)}
                placeholder="e.g. I need help with Data Structures and Algorithms. I struggle with graphs and dynamic programming. I also want motivation during placements..."
                rows={5}
                style={{
                  width: '100%', background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 15, color: '#f0e6ff', lineHeight: 1.7, resize: 'none',
                  fontFamily: 'Rajdhani, sans-serif', caretColor: '#00f0ff',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(0,240,255,0.08)', marginTop: 8 }}>
                <span className="font-mono-custom" style={{ fontSize: 10, color: '#a0a0c8' }}>{needs.length} characters</span>
                <span className="font-mono-custom" style={{ fontSize: 10, color: needs.length >= 8 ? '#00f0ff' : '#a0a0c8' }}>min. 8 chars</span>
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <p className="font-orbitron" style={{ fontSize: 9, letterSpacing: '0.15em', color: '#a0a0c8', textTransform: 'uppercase', marginBottom: 10 }}>Quick Suggestions</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => setNeeds(s)}
                    style={{
                      textAlign: 'left', padding: '10px 14px', borderRadius: 8, fontSize: 13,
                      background: 'rgba(0,240,255,0.03)', border: '1px solid rgba(0,240,255,0.1)',
                      color: '#a0a0c8', cursor: 'pointer', transition: 'all 0.2s',
                      fontFamily: 'Rajdhani, sans-serif',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#f0e6ff'; e.currentTarget.style.borderColor = 'rgba(0,240,255,0.25)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#a0a0c8'; e.currentTarget.style.borderColor = 'rgba(0,240,255,0.1)' }}
                  >
                    ◈ {s}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleGenerate} className="btn-primary" style={{ padding: '16px', borderRadius: 10, fontSize: 11, letterSpacing: '0.15em', width: '100%' }}>
              ◈ Generate My Mentor
            </button>
          </div>
        )}

        {/* ===== GENERATING STEP ===== */}
        {step === 'generating' && (
          <div className="card" style={{ borderRadius: 16, padding: '64px 32px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 28px' }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="ring-ping" style={{ animationDelay: `${i * 0.4}s` }} />
              ))}
              <div style={{
                position: 'absolute', inset: 16, borderRadius: '50%',
                background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: '#00f0ff',
              }}>◈</div>
            </div>
            <h3 className="font-orbitron" style={{ fontSize: 12, letterSpacing: '0.15em', color: '#00f0ff', marginBottom: 8 }}>CONSULTING GEMINI AI</h3>
            <p style={{ fontSize: 14, color: '#a0a0c8', fontFamily: 'Rajdhani, sans-serif' }}>Crafting your unique mentor profile...</p>
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Analyzing your learning needs...', 'Generating mentor identity...', 'Building expertise profile...', 'Preparing NFT metadata...'].map((t, i) => (
                <p key={i} className="font-mono-custom" style={{ fontSize: 11, color: 'rgba(74,74,106,0.5)' }}>◎ {t}</p>
              ))}
            </div>
          </div>
        )}

        {/* ===== PREVIEW STEP ===== */}
        {(step === 'preview' || step === 'minting') && mentor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <MentorCard mentor={{ ...mentor, level: 1, xp: 0 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card" style={{ borderRadius: 10, padding: 18 }}>
                <h4 className="font-orbitron" style={{ fontSize: 9, letterSpacing: '0.12em', color: '#a0a0c8', textTransform: 'uppercase', marginBottom: 8 }}>Personality</h4>
                <p style={{ fontSize: 13, color: '#d0c8f4', lineHeight: 1.6 }}>{mentor.personality}</p>
              </div>
              <div className="card" style={{ borderRadius: 10, padding: 18 }}>
                <h4 className="font-orbitron" style={{ fontSize: 9, letterSpacing: '0.12em', color: '#a0a0c8', textTransform: 'uppercase', marginBottom: 8 }}>Advice Style</h4>
                <p style={{ fontSize: 13, color: '#d0c8f4', lineHeight: 1.6 }}>{mentor.adviceStyle}</p>
              </div>
            </div>

            {mentor.focusAreas?.length > 0 && (
              <div className="card" style={{ borderRadius: 10, padding: 18 }}>
                <h4 className="font-orbitron" style={{ fontSize: 9, letterSpacing: '0.12em', color: '#a0a0c8', textTransform: 'uppercase', marginBottom: 10 }}>Focus Areas</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {mentor.focusAreas.map((a, i) => (
                    <span key={i} className="font-mono-custom" style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: 'rgba(123,47,255,0.1)', border: '1px solid rgba(123,47,255,0.3)', color: '#7b2fff' }}>{a}</span>
                  ))}
                </div>
              </div>
            )}

            {!wallet && (
              <div className="card" style={{ borderRadius: 10, padding: 14, borderColor: 'rgba(255,149,0,0.3)' }}>
                <p className="font-mono-custom" style={{ fontSize: 11, color: '#ff9500' }}>
                  ⚠ You need MetaMask with Sepolia ETH to mint on-chain. Get free ETH at sepoliafaucet.com
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setMentor(null); setStep('input') }} className="btn-outline" disabled={step === 'minting'}
                style={{ flex: 1, padding: '14px', borderRadius: 10, fontSize: 11 }}>
                ↺ Regenerate
              </button>
              <button onClick={handleMint} className="btn-primary" disabled={step === 'minting'}
                style={{ flex: 2, padding: '14px', borderRadius: 10, fontSize: 11, letterSpacing: '0.12em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {step === 'minting' ? (
                  <><span className="spinner" style={{ width: 14, height: 14 }} /> Minting on Sepolia...</>
                ) : '◈ Mint Mentor NFT'}
              </button>
            </div>
          </div>
        )}

        {/* ===== SUCCESS STEP ===== */}
        {step === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card border-animated" style={{ borderRadius: 16, padding: '40px 32px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(0,240,255,0.04), rgba(123,47,255,0.04))' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h2 className="font-orbitron" style={{ fontSize: 22, fontWeight: 900, color: '#00f0ff', textShadow: '0 0 20px rgba(0,240,255,0.5)', marginBottom: 8 }}>MENTOR MINTED!</h2>
              <p style={{ fontSize: 15, color: '#a0a0c8', marginBottom: 24 }}>
                {mentor?.name} is now on the Ethereum blockchain{mintResult?.demo ? ' (demo mode)' : ''}.
              </p>

              {mintResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', maxWidth: 400, margin: '0 auto' }}>
                  <div className="font-mono-custom" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.12)', fontSize: 12 }}>
                    <span style={{ color: '#a0a0c8' }}>Token ID</span>
                    <span style={{ color: '#00f0ff' }}>#{mintResult.tokenId}</span>
                  </div>
                  {!mintResult.demo && (
                    <div className="font-mono-custom" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.12)', fontSize: 12 }}>
                      <span style={{ color: '#a0a0c8' }}>Tx Hash</span>
                      <a href={`https://sepolia.etherscan.io/tx/${mintResult.txHash}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#00f0ff', textDecoration: 'none' }}>
                        {mintResult.txHash.slice(0, 12)}...
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {mentor && <MentorCard mentor={{ ...mentor, level: 1, xp: 0 }} tokenId={mintResult?.tokenId} />}

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => router.push('/dashboard')} className="btn-primary" style={{ flex: 1, padding: 14, borderRadius: 10, fontSize: 11, letterSpacing: '0.12em' }}>
                → View Dashboard
              </button>
              <button onClick={() => router.push('/chat')} className="btn-outline" style={{ flex: 1, padding: 14, borderRadius: 10, fontSize: 11 }}>
                ◎ Chat with Mentor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}