

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

function getApiKey() {
  return process.env.GEMINI_API_KEY
}

function hasApiKey() {
  const key = getApiKey()
  return !!(key && key.trim() !== '' && key !== 'PASTE_YOUR_GEMINI_KEY_HERE')
}

// ---- Generate mentor profile from student needs ----
export async function generateMentorProfile(studentNeeds) {
  const cleaned = studentNeeds
    .replace(/["""'']/g, "'")
    .replace(/[\\]/g, '')
    .replace(/&/g, 'and')
    .trim()

  if (!hasApiKey()) {
    console.warn('No Gemini API key - using demo mentor')
    return getDemoMentor(cleaned)
  }

  const key = getApiKey()
  const prompt = `Create an AI mentor profile for a first-year engineering student.
Student needs: ${cleaned}

Reply ONLY with this JSON (no markdown, no explanation, just the raw JSON object):
{"name":"mentor name here","expertise":"2-3 technical areas","personality":"one sentence about personality","adviceStyle":"one sentence about teaching style","tagline":"short motivating quote","archetype":"Sage","strengths":["skill1","skill2","skill3"],"focusAreas":["area1","area2","area3"]}

Archetype must be one of: Sage, Guide, Hero, Creator, Explorer, Scholar
Make the mentor unique and matched to the student needs.`

  try {
    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 400 },
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error?.message || `Gemini error: ${res.status}`)
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const stripped = text.replace(/```json|```/gi, '').trim()
    const match = stripped.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Gemini did not return valid JSON')
    return JSON.parse(match[0])
  } catch (err) {
    console.warn('Gemini generate failed, using demo:', err.message)
    return getDemoMentor(cleaned)
  }
}

// ---- Chat with mentor (now accepts pre-built systemPrompt from skills) ----
export async function chatWithMentor({ systemPrompt, history, userMessage }) {
  if (!hasApiKey()) {
    throw new Error('GEMINI_API_KEY is missing. Add it to .env.local and restart with: npm run dev')
  }

  const key = getApiKey()

  // Build message array with strict user/model alternation
  const msgs = [
    { role: 'user',  parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Understood. Ready to help.' }] },
  ]

  const recentHistory = (history || []).filter(m => m.content?.trim()).slice(-10)
  for (const msg of recentHistory) {
    const role = msg.role === 'user' ? 'user' : 'model'
    if (role === msgs[msgs.length - 1]?.role) continue
    msgs.push({ role, parts: [{ text: msg.content }] })
  }

  if (msgs[msgs.length - 1]?.role === 'user') {
    msgs.push({ role: 'model', parts: [{ text: 'I see. Go ahead.' }] })
  }

  msgs.push({ role: 'user', parts: [{ text: userMessage }] })

  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: msgs,
      generationConfig: { temperature: 0.9, maxOutputTokens: 350, topP: 0.95 },
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error?.message || `Gemini API error: ${res.status}`)
  }

  const data = await res.json()
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!reply) throw new Error('Gemini returned an empty response. Try again.')
  return reply.trim()
}

// ---- Fallback demo mentors ----
function getDemoMentor(needs) {
  const lower = needs.toLowerCase()
  if (lower.includes('dsa') || lower.includes('algorithm') || lower.includes('data structure')) {
    return {
      name: 'ARIA-7', expertise: 'Data Structures, Algorithms, Competitive Programming',
      personality: 'Analytical and patient, with a talent for breaking hard problems into simple steps.',
      adviceStyle: 'Uses the Socratic method, asking guiding questions so you discover solutions yourself.',
      tagline: 'Every great algorithm starts with a single step.',
      archetype: 'Sage', strengths: ['Pattern Recognition', 'Complexity Analysis', 'Debugging'],
      focusAreas: ['DSA', 'LeetCode', 'System Design'],
    }
  }
  if (lower.includes('web') || lower.includes('react') || lower.includes('node')) {
    return {
      name: 'NEXUS-9', expertise: 'Web Development, React, Node.js, Databases',
      personality: 'Energetic and hands-on, loves building things and shipping fast.',
      adviceStyle: 'Project-first learning. Always asks: what can we build today?',
      tagline: 'Ship it, then improve it.',
      archetype: 'Creator', strengths: ['Full-Stack Dev', 'Cloud Services', 'Rapid Prototyping'],
      focusAreas: ['React', 'Node.js', 'MongoDB'],
    }
  }
  return {
    name: 'ORION', expertise: 'Computer Science Fundamentals, Problem Solving, Career Growth',
    personality: 'Calm and encouraging, believes every student has untapped potential.',
    adviceStyle: 'Builds mental models first, then dives into code.',
    tagline: 'Master the basics, the rest follows.',
    archetype: 'Guide', strengths: ['Conceptual Clarity', 'Motivation', 'Study Planning'],
    focusAreas: ['CS Fundamentals', 'Interview Prep', 'Time Management'],
  }
}