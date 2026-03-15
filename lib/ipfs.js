// ============================================================
// IPFS / METADATA
// For hackathon: encodes metadata as base64 data URI
// For production: upload to Pinata (pinata.cloud) or NFT.Storage
// ============================================================

const ARCHETYPE_COLORS = {
  Sage:    { color: '#7b2fff', symbol: '◈', emoji: '🔮' },
  Guide:   { color: '#00f0ff', symbol: '◎', emoji: '🌊' },
  Hero:    { color: '#ff2d78', symbol: '◆', emoji: '⚡' },
  Creator: { color: '#ff9500', symbol: '◇', emoji: '🔥' },
  Explorer:{ color: '#00ff88', symbol: '○', emoji: '🌌' },
  Scholar: { color: '#f0e6ff', symbol: '△', emoji: '✨' },
}

export function getArchetypeStyle(archetype) {
  return ARCHETYPE_COLORS[archetype] || ARCHETYPE_COLORS.Sage
}

// Generate a unique SVG avatar for the mentor
function generateSVGAvatar(mentor) {
  const style = getArchetypeStyle(mentor.archetype)
  const c = style.color
  const initials = (mentor.name || 'MM')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#0d0d2b"/>
        <stop offset="100%" stop-color="#030308"/>
      </radialGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bg)"/>
    <!-- Grid -->
    ${Array.from({length:8},(_,i)=>`<line x1="${i*57}" y1="0" x2="${i*57}" y2="400" stroke="${c}" stroke-opacity="0.07" stroke-width="1"/>`).join('')}
    ${Array.from({length:8},(_,i)=>`<line x1="0" y1="${i*57}" x2="400" y2="${i*57}" stroke="${c}" stroke-opacity="0.07" stroke-width="1"/>`).join('')}
    <!-- Hex outline -->
    <polygon points="200,60 320,130 320,270 200,340 80,270 80,130"
      fill="${c}" fill-opacity="0.05" stroke="${c}" stroke-width="1.5" stroke-opacity="0.5"/>
    <polygon points="200,100 285,148 285,252 200,300 115,252 115,148"
      fill="${c}" fill-opacity="0.04" stroke="${c}" stroke-width="1" stroke-opacity="0.3"/>
    <!-- Symbol -->
    <text x="200" y="178" text-anchor="middle" font-family="monospace" font-size="52"
      fill="${c}" opacity="0.25">${style.symbol}</text>
    <!-- Initials -->
    <text x="200" y="235" text-anchor="middle" font-family="monospace" font-size="52"
      font-weight="bold" fill="${c}">${initials}</text>
    <!-- Name -->
    <text x="200" y="272" text-anchor="middle" font-family="monospace" font-size="13"
      fill="${c}" opacity="0.75">${(mentor.name||'').toUpperCase()}</text>
    <!-- Archetype -->
    <text x="200" y="294" text-anchor="middle" font-family="monospace" font-size="10"
      fill="${c}" opacity="0.45">${style.emoji} ${(mentor.archetype||'SAGE').toUpperCase()}</text>
    <!-- Corner marks -->
    <rect x="18" y="18" width="28" height="2" fill="${c}" opacity="0.5"/>
    <rect x="18" y="18" width="2" height="28" fill="${c}" opacity="0.5"/>
    <rect x="354" y="18" width="28" height="2" fill="${c}" opacity="0.5"/>
    <rect x="380" y="18" width="2" height="28" fill="${c}" opacity="0.5"/>
    <rect x="18" y="380" width="28" height="2" fill="${c}" opacity="0.5"/>
    <rect x="18" y="354" width="2" height="28" fill="${c}" opacity="0.5"/>
    <rect x="354" y="380" width="28" height="2" fill="${c}" opacity="0.5"/>
    <rect x="380" y="354" width="2" height="28" fill="${c}" opacity="0.5"/>
  </svg>`
}

// Build full NFT metadata and encode as data URI
export function buildTokenURI(mentor) {
  const imageBase64 = Buffer.from(generateSVGAvatar(mentor)).toString('base64')
  const imageURI = `data:image/svg+xml;base64,${imageBase64}`

  const metadata = {
    name: mentor.name,
    description: `${mentor.name} is an AI mentor specializing in ${mentor.expertise}. ${mentor.personality}`,
    image: imageURI,
    attributes: [
      { trait_type: 'Expertise',    value: mentor.expertise },
      { trait_type: 'Personality',  value: mentor.personality },
      { trait_type: 'Advice Style', value: mentor.adviceStyle },
      { trait_type: 'Archetype',    value: mentor.archetype || 'Sage' },
      { trait_type: 'Level',        value: 1, display_type: 'number' },
      { trait_type: 'Tagline',      value: mentor.tagline || '' },
      ...(mentor.strengths || []).map((s, i) => ({
        trait_type: `Strength ${i + 1}`,
        value: s,
      })),
    ],
  }

  const json = JSON.stringify(metadata)
  const encoded = Buffer.from(json).toString('base64')
  return `data:application/json;base64,${encoded}`
}
