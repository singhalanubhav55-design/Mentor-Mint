// ============================================================
// MENTOR SKILLS SYSTEM
// Instead of one generic chatbot, the mentor has specialised
// skills it invokes based on what the student asks.
// This is what your mentor meant by "skills model vs LLM model"
// ============================================================

export const SKILLS = {
  // ── Skill 1: Explain a concept ──────────────────────────
  EXPLAIN: {
    id: 'explain',
    name: 'Concept Explainer',
    icon: '🔍',
    color: '00f0ff',
    triggers: ['explain', 'what is', 'what are', 'how does', 'tell me about', 'define', 'meaning of'],
    systemAddition: `When explaining concepts:
- Start with a 1-line simple definition
- Give a real-world analogy
- Then give the technical detail
- End with a small example or code snippet if relevant`,
  },

  // ── Skill 2: Debug / Fix code ────────────────────────────
  DEBUG: {
    id: 'debug',
    name: 'Code Debugger',
    icon: '🐛',
    color: 'ff2d78',
    triggers: ['debug', 'error', 'not working', 'fix', 'wrong', 'issue', 'problem with', 'crash', 'exception', 'undefined', 'null'],
    systemAddition: `When debugging:
- First identify the type of error (syntax/logic/runtime)
- Pinpoint the exact line or cause
- Explain WHY it happened in simple terms
- Give the corrected code
- Add a tip to avoid this mistake in future`,
  },

  // ── Skill 3: Roadmap / Study plan ───────────────────────
  ROADMAP: {
    id: 'roadmap',
    name: 'Study Planner',
    icon: '🗺️',
    color: '7b2fff',
    triggers: ['roadmap', 'how to learn', 'study plan', 'where to start', 'path', 'guide me', 'syllabus', 'what to study', 'prepare for'],
    systemAddition: `When giving a roadmap:
- Break into clear Week 1 / Week 2 / Week 3 stages
- Keep each stage achievable (3-5 topics max)
- Recommend one free resource per stage
- End with a milestone the student can test themselves on`,
  },

  // ── Skill 4: Motivate ────────────────────────────────────
  MOTIVATE: {
    id: 'motivate',
    name: 'Motivator',
    icon: '⚡',
    color: 'ff9500',
    triggers: ['motivate', 'feeling lost', 'give up', 'too hard', 'cant do', "can't do", 'demotivated', 'stressed', 'tired', 'struggling', 'help me feel'],
    systemAddition: `When motivating:
- Acknowledge their feeling first (don't dismiss it)
- Share one short insight about how struggle = growth
- Give one small, immediately actionable next step
- End with a powerful one-liner specific to their situation`,
  },

  // ── Skill 5: Code Review ─────────────────────────────────
  REVIEW: {
    id: 'review',
    name: 'Code Reviewer',
    icon: '👁️',
    color: '00c896',
    triggers: ['review my', 'check my', 'is this correct', 'look at my code', 'improve my', 'better way', 'optimise', 'optimize', 'refactor'],
    systemAddition: `When reviewing code:
- Rate it: Correctness / Readability / Efficiency (out of 5)
- Point out what is done WELL first
- Then list max 3 improvements with explanations
- Show the improved version`,
  },

  // ── Skill 6: Interview Prep ──────────────────────────────
  INTERVIEW: {
    id: 'interview',
    name: 'Interview Coach',
    icon: '🎯',
    color: 'ff2d78',
    triggers: ['interview', 'placement', 'asked in', 'commonly asked', 'practice question', 'mock', 'hr round', 'technical round'],
    systemAddition: `When helping with interviews:
- Frame it as: "Here's how an interviewer thinks about this"
- Give the ideal answer structure (STAR or step-by-step)
- Include one follow-up question the interviewer might ask
- Give a confidence tip at the end`,
  },
}

// ── Detect which skill to use based on the message ──────────
export function detectSkill(message) {
  const lower = message.toLowerCase()

  for (const skill of Object.values(SKILLS)) {
    if (skill.triggers.some(trigger => lower.includes(trigger))) {
      return skill
    }
  }

  // Default — general help
  return {
    id: 'general',
    name: 'General Help',
    icon: '💬',
    color: '9090b0',
    systemAddition: 'Give a helpful, encouraging, specific answer.',
  }
}

// ── Build the enhanced system prompt with skill injected ─────
export function buildSkillPrompt(mentor, skill) {
  return `You are ${mentor.name}, an AI mentor for a first-year engineering student.
Expertise: ${mentor.expertise}
Personality: ${mentor.personality}
Teaching style: ${mentor.adviceStyle}

You are currently using your "${skill.name}" skill.
${skill.systemAddition}

General rules:
- Stay in character as ${mentor.name} at all times
- Be specific and concrete, never vague
- Keep replies under 180 words
- Format code in backticks
- Use simple language
- Never repeat the same opening phrase twice`
}