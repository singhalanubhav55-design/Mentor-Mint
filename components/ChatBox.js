

'use client'
import { useState, useRef, useEffect } from 'react'
import {
  loadProfile, saveProfile, analyseAndUpdateProfile,
  getSkillLabel, getSkillColor
} from '@/lib/studentProfile'

// ── Storage helpers ───────────────────────────────────────────
const CHAT_KEY = 'mentorMint_chatHistory'
const MAX_STORED = 100  // max messages to keep in storage

function loadMessages(mentorName, tagline) {
  try {
    const raw = localStorage.getItem(CHAT_KEY)
    if (!raw) return defaultMessages(mentorName, tagline)
    const parsed = JSON.parse(raw)
    // Restore Date objects (JSON stringifies them as strings)
    return parsed.map(m => ({ ...m, time: new Date(m.time) }))
  } catch {
    return defaultMessages(mentorName, tagline)
  }
}

function saveMessages(msgs) {
  try {
    // Only save last MAX_STORED messages to avoid filling storage
    const toSave = msgs.slice(-MAX_STORED)
    localStorage.setItem(CHAT_KEY, JSON.stringify(toSave))
  } catch {}
}

function clearMessages() {
  try { localStorage.removeItem(CHAT_KEY) } catch {}
}

function defaultMessages(mentorName, tagline) {
  return [{
    role: 'mentor',
    content: `Hello! I am ${mentorName || 'your mentor'}. ${tagline || 'Ready to guide you.'} What would you like to learn today?`,
    time: new Date(),
    skill: null,
  }]
}

// ── Constants ─────────────────────────────────────────────────
const SKILL_COLORS = {
  explain:   { bg: 'rgba(0,240,255,0.1)',   border: 'rgba(0,240,255,0.35)',   text: '#00f0ff' },
  debug:     { bg: 'rgba(255,45,120,0.1)',  border: 'rgba(255,45,120,0.35)',  text: '#ff5590' },
  roadmap:   { bg: 'rgba(123,47,255,0.1)',  border: 'rgba(123,47,255,0.35)',  text: '#9b5fff' },
  motivate:  { bg: 'rgba(255,149,0,0.1)',   border: 'rgba(255,149,0,0.35)',   text: '#ffaa33' },
  review:    { bg: 'rgba(0,200,150,0.1)',   border: 'rgba(0,200,150,0.35)',   text: '#00c896' },
  interview: { bg: 'rgba(255,45,120,0.1)',  border: 'rgba(255,45,120,0.35)',  text: '#ff5590' },
  general:   { bg: 'rgba(144,144,176,0.1)', border: 'rgba(144,144,176,0.25)', text: '#9090b0' },
}

const MOOD_INFO = {
  struggling: { icon: '😟', color: '#ff5590', label: 'Struggling' },
  confused:   { icon: '😕', color: '#ffaa33', label: 'Confused'   },
  confident:  { icon: '😎', color: '#00c896', label: 'Confident'  },
  motivated:  { icon: '🔥', color: '#ff9500', label: 'Motivated'  },
  neutral:    { icon: '😐', color: '#9090b0', label: 'Neutral'    },
}

// ── Component ─────────────────────────────────────────────────
export default function ChatBox({ mentor }) {
  const [messages, setMessages]         = useState([])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [activeSkill, setActiveSkill]   = useState(null)
  const [profile, setProfile]           = useState(null)
  const [showProfile, setShowProfile]   = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [initialized, setInitialized]   = useState(false)
  const bottomRef = useRef(null)

  // ── Load messages + profile from localStorage on mount ──────
  useEffect(() => {
    const saved = loadMessages(mentor?.name, mentor?.tagline)
    setMessages(saved)
    setProfile(loadProfile())
    setInitialized(true)
  }, [mentor?.name, mentor?.tagline])

  // ── Auto-scroll on new message ───────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Save messages to localStorage whenever they change ───────
  useEffect(() => {
    if (!initialized) return   // don't save before initial load
    saveMessages(messages)
  }, [messages, initialized])

  // ── Send message ─────────────────────────────────────────────
  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const updatedProfile = analyseAndUpdateProfile(text, profile || {})
    setProfile(updatedProfile)
    saveProfile(updatedProfile)

    const userMsg = { role: 'user', content: text, time: new Date(), skill: null }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setActiveSkill(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentor,
          studentProfile: updatedProfile,
          history: messages.filter(m => m.role !== 'system').slice(-10),
          userMessage: text,
        }),
      })
      const data = await res.json()

      if (!data.success) {
        setMessages(prev => [...prev, {
          role: 'mentor', time: new Date(), skill: null, isError: true,
          content: `⚠ Error: ${data.error}\n\nCheck GEMINI_API_KEY in .env.local and restart the server.`,
        }])
        return
      }

      if (data.skill) setActiveSkill(data.skill)
      setMessages(prev => [...prev, {
        role: 'mentor', content: data.response,
        time: new Date(), skill: data.skill || null,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'mentor', time: new Date(), skill: null, isError: true,
        content: `⚠ Network error: ${err.message}`,
      }])
    } finally {
      setLoading(false)
    }
  }

  // ── Clear chat history ────────────────────────────────────────
  function handleClear() {
    clearMessages()
    const fresh = defaultMessages(mentor?.name, mentor?.tagline)
    setMessages(fresh)
    setShowClearConfirm(false)
    setActiveSkill(null)
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function fmt(d) {
    if (!d) return ''
    const date = new Date(d)
    const isToday = new Date().toDateString() === date.toDateString()
    if (isToday) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
           date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const mentorInitial  = (mentor?.name || 'M').slice(0, 1).toUpperCase()
  const mood           = MOOD_INFO[profile?.mood] || MOOD_INFO.neutral
  const skillEntries   = Object.entries(profile?.skills || {})
  const totalMessages  = messages.filter(m => m.role === 'user').length

  if (!initialized) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Top bar ── */}
      <div style={{
        padding: '6px 14px', borderBottom: '1px solid rgba(0,240,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 38,
        flexWrap: 'wrap', gap: 6,
      }}>
        {/* Left: active skill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {activeSkill ? (
            <>
              <span style={{ fontSize: 13 }}>{activeSkill.icon}</span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: `#${activeSkill.color}`, letterSpacing: '0.08em' }}>
                {activeSkill.name} active
              </span>
            </>
          ) : (
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#6868a0' }}>
              {totalMessages} messages · skill auto-detects
            </span>
          )}
        </div>

        {/* Right: profile toggle + clear button */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setShowProfile(p => !p)} style={{
            padding: '3px 12px', borderRadius: 14, fontSize: 10, cursor: 'pointer',
            background: showProfile ? 'rgba(123,47,255,0.15)' : 'rgba(0,240,255,0.04)',
            border: showProfile ? '1px solid rgba(123,47,255,0.4)' : '1px solid rgba(0,240,255,0.15)',
            color: showProfile ? '#9b5fff' : '#8080c0',
            fontFamily: 'Space Mono, monospace', transition: 'all 0.2s',
          }}>
            {mood.icon} Profile {showProfile ? '▲' : '▼'}
          </button>

          {/* Clear chat button */}
          {!showClearConfirm ? (
            <button onClick={() => setShowClearConfirm(true)} style={{
              padding: '3px 10px', borderRadius: 14, fontSize: 10, cursor: 'pointer',
              background: 'rgba(255,45,120,0.05)', border: '1px solid rgba(255,45,120,0.2)',
              color: '#c060a0', fontFamily: 'Space Mono, monospace', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ff5590'; e.currentTarget.style.borderColor = 'rgba(255,45,120,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#c060a0'; e.currentTarget.style.borderColor = 'rgba(255,45,120,0.2)' }}
            >
              🗑 Clear
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#ff5590' }}>Sure?</span>
              <button onClick={handleClear} style={{
                padding: '2px 10px', borderRadius: 10, fontSize: 10, cursor: 'pointer',
                background: 'rgba(255,45,120,0.2)', border: '1px solid rgba(255,45,120,0.5)',
                color: '#ff5590', fontFamily: 'Space Mono, monospace',
              }}>Yes</button>
              <button onClick={() => setShowClearConfirm(false)} style={{
                padding: '2px 10px', borderRadius: 10, fontSize: 10, cursor: 'pointer',
                background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.2)',
                color: '#00f0ff', fontFamily: 'Space Mono, monospace',
              }}>No</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Student Profile Panel ── */}
      {showProfile && (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,240,255,0.1)', background: 'rgba(10,10,30,0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: '#8080c0', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Your Learning Profile
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '2px 10px',
                borderRadius: 20, background: `${mood.color}18`, border: `1px solid ${mood.color}44`,
                fontFamily: 'Space Mono, monospace', fontSize: 10, color: mood.color,
              }}>
                {mood.icon} {mood.label}
              </div>
              {profile?.learningStyle !== 'unknown' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '2px 10px',
                  borderRadius: 20, background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.25)',
                  fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00f0ff',
                }}>
                  {profile.learningStyle === 'practical' ? '⚙️' : profile.learningStyle === 'theoretical' ? '📖' : '👁️'} {profile.learningStyle}
                </div>
              )}
            </div>
          </div>

          {skillEntries.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {skillEntries.map(([topic, level]) => {
                const color = getSkillColor(level)
                const label = getSkillLabel(level)
                const pct   = Math.round((level / 3) * 100)
                return (
                  <div key={topic} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, fontWeight: 600, color: '#ddd6ff' }}>{topic}</span>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color }}>{label}</span>
                    </div>
                    <div className="skill-bar-track">
                      <div className="skill-bar-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#8080c0', textAlign: 'center', padding: '8px 0' }}>
              Ask questions to build your skill profile
            </p>
          )}

          {(profile?.weakAreas?.length > 0 || profile?.strongAreas?.length > 0) && (
            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              {profile.weakAreas?.length > 0 && (
                <div>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#ff5590' }}>Needs work: </span>
                  {profile.weakAreas.map(t => <span key={t} style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: '#ff5590', marginRight: 6 }}>{t}</span>)}
                </div>
              )}
              {profile.strongAreas?.length > 0 && (
                <div>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#00c896' }}>Strong in: </span>
                  {profile.strongAreas.map(t => <span key={t} style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: '#00c896', marginRight: 6 }}>{t}</span>)}
                </div>
              )}
            </div>
          )}
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#4848a0', marginTop: 10 }}>
            {profile?.messageCount || 0} messages analysed · {totalMessages} total chats stored · Mentor adapts automatically
          </p>
        </div>
      )}

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Date separator helper */}
        {messages.map((msg, i) => {
          // Show date separator when date changes
          const showDate = i === 0 || (
            new Date(messages[i-1].time).toDateString() !== new Date(msg.time).toDateString()
          )
          return (
            <div key={i}>
              {showDate && (
                <div style={{ textAlign: 'center', margin: '8px 0' }}>
                  <span style={{
                    fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#6060a0',
                    padding: '3px 14px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    {new Date(msg.time).toDateString() === new Date().toDateString()
                      ? 'Today'
                      : new Date(msg.time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: 7, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Orbitron, sans-serif', fontSize: 12, fontWeight: 700,
                  background: msg.role === 'mentor' ? 'rgba(0,240,255,0.12)' : 'rgba(123,47,255,0.18)',
                  border: msg.role === 'mentor' ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(123,47,255,0.45)',
                  color: msg.role === 'mentor' ? '#00f0ff' : '#9b5fff',
                }}>
                  {msg.role === 'mentor' ? mentorInitial : 'U'}
                </div>

                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Skill badge */}
                  {msg.role === 'mentor' && msg.skill && (() => {
                    const sc = SKILL_COLORS[msg.skill.id] || SKILL_COLORS.general
                    return (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '2px 10px', borderRadius: 20, alignSelf: 'flex-start',
                        background: sc.bg, border: `1px solid ${sc.border}`,
                        fontFamily: 'Space Mono, monospace', fontSize: 9, color: sc.text,
                      }}>
                        {msg.skill.icon} {msg.skill.name}
                      </div>
                    )
                  })()}

                  {/* Bubble */}
                  <div
                    className={msg.role === 'user' ? 'bubble-user' : 'bubble-mentor'}
                    style={{
                      padding: '12px 16px',
                      ...(msg.isError ? { borderColor: 'rgba(255,45,120,0.4)', background: 'rgba(255,45,120,0.06)' } : {}),
                    }}
                  >
                    <p style={{
                      fontSize: 15, fontWeight: 500,
                      color: msg.isError ? '#ff5590' : '#e8e0ff',
                      lineHeight: 1.7, whiteSpace: 'pre-wrap',
                      fontFamily: 'Rajdhani, sans-serif',
                    }}>
                      {msg.content}
                    </p>
                    <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#6868a0', marginTop: 6, textAlign: 'right' }}>
                      {fmt(msg.time)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 7, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,240,255,0.12)', border: '1px solid rgba(0,240,255,0.4)',
              fontFamily: 'Orbitron, sans-serif', fontSize: 12, color: '#00f0ff',
            }}>
              {mentorInitial}
            </div>
            <div className="bubble-mentor" style={{ padding: '14px 18px', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#00f0ff',
                  animation: 'pulse 1s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`, opacity: 0.7,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Skill quick picks ── */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(0,240,255,0.08)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          { label: '🔍 Explain',   text: 'Explain this concept to me: ' },
          { label: '🐛 Debug',     text: 'Help me debug this: ' },
          { label: '🗺️ Roadmap',  text: 'Give me a study roadmap for ' },
          { label: '⚡ Motivate',  text: 'I am feeling demotivated, help me' },
          { label: '👁️ Review',   text: 'Review my code: ' },
          { label: '🎯 Interview', text: 'Help me prepare for interview questions on ' },
        ].map((q, i) => (
          <button key={i} onClick={() => setInput(q.text)} style={{
            padding: '3px 10px', borderRadius: 14, fontSize: 11,
            background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.14)',
            color: '#9090b0', cursor: 'pointer', transition: 'all 0.2s',
            fontFamily: 'Space Mono, monospace',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e8e0ff'; e.currentTarget.style.borderColor = 'rgba(0,240,255,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9090b0'; e.currentTarget.style.borderColor = 'rgba(0,240,255,0.14)' }}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* ── Input ── */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(0,240,255,0.1)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 10, overflow: 'hidden' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask your mentor anything..."
            rows={1}
            disabled={loading}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              padding: '11px 14px', fontSize: 15, fontWeight: 500,
              color: '#e8e0ff', resize: 'none',
              fontFamily: 'Rajdhani, sans-serif', maxHeight: 100,
              caretColor: '#00f0ff',
            }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
            }}
          />
        </div>
        <button onClick={send} disabled={!input.trim() || loading} className="btn-primary"
          style={{ padding: '11px 16px', borderRadius: 10, flexShrink: 0, opacity: (!input.trim() || loading) ? 0.3 : 1 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#5050a0', textAlign: 'center', padding: '0 16px 10px' }}>
        Enter to send · Shift+Enter for new line · Chats saved automatically
      </p>
    </div>
  )
}