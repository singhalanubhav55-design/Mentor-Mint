// ============================================================
// STUDENT PROFILE SYSTEM
// Analyses every message → builds a dynamic student profile
// Profile is stored in localStorage and grows over time
// Mentor adapts ALL responses based on this profile
// ============================================================

// ── Default empty profile ────────────────────────────────────
export function getDefaultProfile() {
  return {
    // Skill levels per topic (0=unknown, 1=beginner, 2=intermediate, 3=advanced)
    skills: {},

    // Detected weaknesses (topics they struggle with)
    weakAreas: [],

    // Detected strengths
    strongAreas: [],

    // Learning style detected from their messages
    // 'visual' | 'practical' | 'theoretical' | 'unknown'
    learningStyle: 'unknown',

    // Emotional state from recent messages
    // 'motivated' | 'struggling' | 'confused' | 'confident' | 'neutral'
    mood: 'neutral',

    // Total messages sent (proxy for engagement)
    messageCount: 0,

    // Topics they have asked about
    topicsAsked: [],

    // Last updated
    updatedAt: null,
  }
}

// ── Load profile from localStorage ──────────────────────────
export function loadProfile() {
  try {
    const raw = localStorage.getItem('mentorMint_studentProfile')
    return raw ? JSON.parse(raw) : getDefaultProfile()
  } catch {
    return getDefaultProfile()
  }
}

// ── Save profile to localStorage ─────────────────────────────
export function saveProfile(profile) {
  try {
    profile.updatedAt = Date.now()
    localStorage.setItem('mentorMint_studentProfile', JSON.stringify(profile))
  } catch {}
}

// ── Analyse a student message and update profile ─────────────
export function analyseAndUpdateProfile(message, profile) {
  const lower = message.toLowerCase()
  const updated = { ...profile }
  updated.messageCount = (updated.messageCount || 0) + 1

  // ── Detect mood ────────────────────────────────────────────
  const struggleWords = ['cant', "can't", 'dont understand', "don't understand", 'confused', 'lost', 'stuck', 'help', 'difficult', 'hard', 'failing', 'give up', 'demotivated', 'stressed', 'overwhelmed']
  const confidentWords = ['understood', 'got it', 'i know', 'makes sense', 'clear', 'easy', 'done', 'solved', 'worked']
  const motivatedWords = ['excited', 'let\'s go', 'ready', 'motivated', 'want to learn', 'interested']

  if (struggleWords.some(w => lower.includes(w))) updated.mood = 'struggling'
  else if (confidentWords.some(w => lower.includes(w))) updated.mood = 'confident'
  else if (motivatedWords.some(w => lower.includes(w))) updated.mood = 'motivated'
  else updated.mood = 'neutral'

  // ── Detect learning style ─────────────────────────────────
  if (lower.includes('example') || lower.includes('show me') || lower.includes('code')) {
    updated.learningStyle = 'practical'
  } else if (lower.includes('why') || lower.includes('theory') || lower.includes('concept') || lower.includes('how does')) {
    updated.learningStyle = 'theoretical'
  } else if (lower.includes('diagram') || lower.includes('visualise') || lower.includes('picture') || lower.includes('draw')) {
    updated.learningStyle = 'visual'
  }

  // ── Detect topic and skill level ─────────────────────────
  const topicMap = {
    'array':           'Arrays',
    'linked list':     'Linked Lists',
    'tree':            'Trees',
    'graph':           'Graphs',
    'dynamic programming': 'Dynamic Programming',
    'dp ':             'Dynamic Programming',
    'recursion':       'Recursion',
    'sorting':         'Sorting',
    'searching':       'Searching',
    'stack':           'Stacks & Queues',
    'queue':           'Stacks & Queues',
    'hash':            'Hashing',
    'binary search':   'Binary Search',
    'react':           'React',
    'node':            'Node.js',
    'javascript':      'JavaScript',
    'python':          'Python',
    'java ':           'Java',
    'c++':             'C++',
    'sql':             'SQL',
    'database':        'Databases',
    'os ':             'Operating Systems',
    'operating system':'Operating Systems',
    'network':         'Computer Networks',
    'oops':            'OOP',
    'object oriented': 'OOP',
    'system design':   'System Design',
    'algorithm':       'Algorithms',
    'complexity':      'Time Complexity',
    'big o':           'Time Complexity',
  }

  Object.entries(topicMap).forEach(([keyword, topic]) => {
    if (lower.includes(keyword)) {
      // Add to topics asked
      if (!updated.topicsAsked.includes(topic)) {
        updated.topicsAsked = [...(updated.topicsAsked || []), topic].slice(-20)
      }

      // Determine skill level from message tone
      const isStruggling = struggleWords.some(w => lower.includes(w))
      const isConfident  = confidentWords.some(w => lower.includes(w))

      if (!updated.skills[topic]) {
        // First time asking — assume beginner
        updated.skills[topic] = 1
      } else if (isStruggling && updated.skills[topic] > 1) {
        // Struggling → lower estimate
        updated.skills[topic] = Math.max(1, updated.skills[topic] - 0.5)
      } else if (isConfident) {
        // Confident → raise estimate
        updated.skills[topic] = Math.min(3, updated.skills[topic] + 0.5)
      }

      // Update weak/strong areas
      const level = updated.skills[topic]
      if (level < 1.5 && !updated.weakAreas.includes(topic)) {
        updated.weakAreas = [...(updated.weakAreas || []), topic].slice(-5)
        updated.strongAreas = updated.strongAreas.filter(t => t !== topic)
      } else if (level >= 2.5 && !updated.strongAreas.includes(topic)) {
        updated.strongAreas = [...(updated.strongAreas || []), topic].slice(-5)
        updated.weakAreas = updated.weakAreas.filter(t => t !== topic)
      }
    }
  })

  return updated
}

// ── Convert profile into a prompt addition for Gemini ────────
export function profileToPrompt(profile) {
  if (!profile || profile.messageCount === 0) return ''

  const lines = []

  // Skill levels
  const skills = Object.entries(profile.skills || {})
  if (skills.length > 0) {
    const skillSummary = skills.map(([topic, level]) => {
      const label = level < 1.5 ? 'beginner' : level < 2.5 ? 'intermediate' : 'advanced'
      return `${topic}: ${label}`
    }).join(', ')
    lines.push(`Student skill levels: ${skillSummary}`)
  }

  // Mood adaptation
  if (profile.mood === 'struggling') {
    lines.push('Student is currently struggling — be extra patient, use simpler language, break things into tiny steps, add encouragement')
  } else if (profile.mood === 'confident') {
    lines.push('Student seems confident — you can be more technical, skip basics, challenge them a bit')
  } else if (profile.mood === 'motivated') {
    lines.push('Student is motivated — match their energy, be enthusiastic')
  }

  // Learning style adaptation
  if (profile.learningStyle === 'practical') {
    lines.push('Student learns best with code examples — always include a code snippet')
  } else if (profile.learningStyle === 'theoretical') {
    lines.push('Student prefers theory — explain the "why" before the "how"')
  } else if (profile.learningStyle === 'visual') {
    lines.push('Student is visual — use ASCII diagrams or step-by-step breakdowns')
  }

  // Weak areas
  if (profile.weakAreas?.length > 0) {
    lines.push(`Student struggles with: ${profile.weakAreas.join(', ')} — be extra careful explaining these`)
  }

  // Strong areas
  if (profile.strongAreas?.length > 0) {
    lines.push(`Student is strong in: ${profile.strongAreas.join(', ')} — can use these as analogies`)
  }

  if (lines.length === 0) return ''

  return `\n\nSTUDENT PROFILE (adapt your response based on this):\n${lines.join('\n')}`
}

// ── Get skill level label ─────────────────────────────────────
export function getSkillLabel(level) {
  if (!level || level < 1.5) return 'Beginner'
  if (level < 2.5) return 'Intermediate'
  return 'Advanced'
}

// ── Get skill color ───────────────────────────────────────────
export function getSkillColor(level) {
  if (!level || level < 1.5) return '#ff5590'
  if (level < 2.5) return '#ffaa33'
  return '#00c896'
}