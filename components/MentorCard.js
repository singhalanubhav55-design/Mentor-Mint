'use client'
import { getArchetypeStyle } from '@/lib/ipfs'
import { xpProgressPercent } from '@/lib/contract'

const LEVEL_TITLES = ['', 'Initiate', 'Apprentice', 'Adept', 'Scholar', 'Expert', 'Master', 'Grand Master', 'Legend', 'Mythic', 'Transcendent']

export default function MentorCard({ mentor, tokenId, compact = false }) {
  if (!mentor) return null

  const style = getArchetypeStyle(mentor.archetype)
  const c = style.color
  const level = mentor.level || 1
  const xp = mentor.xp || 0
  const progress = xpProgressPercent(level, xp)
  const title = LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)]

  const initials = (mentor.name || 'MM')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="card" style={{ borderRadius: 12, borderColor: `${c}20`, overflow: 'hidden', position: 'relative' }}>
      {/* Accent glow */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: c, opacity: 0.07, filter: 'blur(30px)', pointerEvents: 'none' }} />

      <div style={{ padding: compact ? 16 : 24, position: 'relative' }}>
        {/* Top row */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={{
            width: compact ? 48 : 68,
            height: compact ? 48 : 68,
            flexShrink: 0,
            borderRadius: 8,
            background: `${c}12`,
            border: `1px solid ${c}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 700,
            fontSize: compact ? 14 : 20,
            color: c,
            position: 'relative',
          }}>
            {initials}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: `radial-gradient(circle at 30% 30%, ${c}30, transparent 70%)` }} />
          </div>

          {/* Name + info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="font-orbitron" style={{ fontSize: compact ? 13 : 16, fontWeight: 700, color: c, textShadow: `0 0 10px ${c}55` }}>
                {mentor.name}
              </span>
              {tokenId && (
                <span className="font-mono-custom" style={{ fontSize: 11, color: '#a0a0c8' }}>#{tokenId}</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#a0a0c8', marginTop: 2, fontFamily: 'Space Mono, monospace' }}>
              {style.emoji} {mentor.archetype || 'Sage'}
            </div>
            {!compact && mentor.tagline && (
              <div style={{ fontSize: 12, color: '#c8c0f0', marginTop: 4, fontStyle: 'italic' }}>
                "{mentor.tagline}"
              </div>
            )}
          </div>

          {/* Level badge */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{
              background: `${c}15`,
              border: `1px solid ${c}40`,
              borderRadius: 8,
              padding: compact ? '6px 10px' : '8px 14px',
            }}>
              <div className="font-orbitron" style={{ fontSize: compact ? 20 : 28, fontWeight: 900, color: c, lineHeight: 1, textShadow: `0 0 12px ${c}` }}>
                {level}
              </div>
              <div style={{ fontSize: 9, color: '#a0a0c8', letterSpacing: '0.1em', marginTop: 2 }}>LVL</div>
            </div>
            <div className="font-orbitron" style={{ fontSize: 8, color: c, marginTop: 4, opacity: 0.7, letterSpacing: '0.05em' }}>
              {title}
            </div>
          </div>
        </div>

        {!compact && (
          <>
            {/* Expertise tags */}
            <div style={{ marginTop: 16 }}>
              <div className="font-orbitron" style={{ fontSize: 9, color: '#a0a0c8', letterSpacing: '0.15em', marginBottom: 6, textTransform: 'uppercase' }}>Expertise</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(mentor.expertise || '').split(',').map((ex, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 4,
                    background: `${c}10`, border: `1px solid ${c}30`, color: `${c}cc`,
                    fontFamily: 'Space Mono, monospace',
                  }}>
                    {ex.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Strengths */}
            {mentor.strengths?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="font-orbitron" style={{ fontSize: 9, color: '#a0a0c8', letterSpacing: '0.15em', marginBottom: 6, textTransform: 'uppercase' }}>Strengths</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {mentor.strengths.slice(0, 3).map((s, i) => (
                    <span key={i} style={{ fontSize: 11, color: 'rgba(240,230,255,0.4)', fontFamily: 'Space Mono, monospace' }}>
                      ◈ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* XP bar */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="font-orbitron" style={{ fontSize: 9, color: '#a0a0c8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Experience</span>
                <span className="font-mono-custom" style={{ fontSize: 10, color: c }}>{xp} XP</span>
              </div>
              <div style={{ height: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span className="font-mono-custom" style={{ fontSize: 10, color: '#a0a0c8' }}>Lv.{level}</span>
                <span className="font-mono-custom" style={{ fontSize: 10, color: '#a0a0c8' }}>{progress}% → Lv.{level + 1}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}