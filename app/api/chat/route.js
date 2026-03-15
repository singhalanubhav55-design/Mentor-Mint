// console.log('KEY CHECK:', process.env.GEMINI_API_KEY?.slice(0, 8))
// import { NextResponse } from 'next/server'
// import { chatWithMentor } from '@/lib/gemini'

// export async function POST(request) {
//   try {
//     const body = await request.json()
//     const { mentorName, expertise, personality, adviceStyle, history, userMessage } = body

//     if (!userMessage?.trim()) {
//       return NextResponse.json(
//         { success: false, error: 'Message is empty' },
//         { status: 400 }
//       )
//     }

//     const reply = await chatWithMentor({
//       mentorName,
//       expertise,
//       personality,
//       adviceStyle,
//       history: history || [],
//       userMessage: userMessage.trim(),
//     })

//     return NextResponse.json({ success: true, response: reply })
//   } catch (err) {
//     console.error('chat error:', err)
//     return NextResponse.json(
//       { success: false, error: err.message || 'Chat failed' },
//       { status: 500 }
//     )
//   }
// }


// import { NextResponse } from 'next/server'
// import { chatWithMentor, analyseImage } from '@/lib/gemini'

// export async function POST(request) {
//   try {
//     const body = await request.json()
//     const { mentorName, expertise, personality, adviceStyle, history, userMessage, imageBase64, mimeType } = body

//     if (!userMessage?.trim() && !imageBase64) {
//       return NextResponse.json({ success: false, error: 'Message is empty' }, { status: 400 })
//     }

//     let reply

//     // If image is attached — use multimodal analysis
//     if (imageBase64) {
//       reply = await analyseImage({
//         mentorName,
//         expertise,
//         adviceStyle,
//         imageBase64,
//         mimeType,
//         question: userMessage?.trim(),
//       })
//     } else {
//       reply = await chatWithMentor({
//         mentorName,
//         expertise,
//         personality,
//         adviceStyle,
//         history: history || [],
//         userMessage: userMessage.trim(),
//       })
//     }

//     return NextResponse.json({ success: true, response: reply })

//   } catch (err) {
//     console.error('Chat API error:', err.message)
//     return NextResponse.json({ success: false, error: err.message }, { status: 500 })
//   }
// }


import { NextResponse } from 'next/server'
import { chatWithMentor } from '@/lib/gemini'
import { detectSkill, buildSkillPrompt } from '@/lib/skills'

export async function POST(request) {
  try {
    const body = await request.json()
    const { mentor, history, userMessage, studentProfile } = body

    if (!userMessage?.trim()) {
      return NextResponse.json({ success: false, error: 'Message is empty' }, { status: 400 })
    }

    // 1. Detect which skill to use
    const skill = detectSkill(userMessage)

    // 2. Build base prompt from skill
    let systemPrompt = buildSkillPrompt(mentor, skill)

    // 3. Inject student profile so mentor adapts to the student
    if (studentProfile) {
      const profileLines = []

      const skills = Object.entries(studentProfile.skills || {})
      if (skills.length > 0) {
        const summary = skills.map(([topic, level]) => {
          const label = level < 1.5 ? 'beginner' : level < 2.5 ? 'intermediate' : 'advanced'
          return `${topic}:${label}`
        }).join(', ')
        profileLines.push(`Student skill levels — ${summary}`)
      }

      if (studentProfile.mood === 'struggling') {
        profileLines.push('Student is struggling right now — be extra gentle, patient, use very simple language and break into tiny steps')
      } else if (studentProfile.mood === 'confident') {
        profileLines.push('Student is confident — can be more technical, skip basics, add a small challenge')
      } else if (studentProfile.mood === 'motivated') {
        profileLines.push('Student is motivated — match their energy and enthusiasm')
      }

      if (studentProfile.learningStyle === 'practical') {
        profileLines.push('Student learns by doing — always include a concrete code example')
      } else if (studentProfile.learningStyle === 'theoretical') {
        profileLines.push('Student likes theory — explain the WHY before the HOW')
      } else if (studentProfile.learningStyle === 'visual') {
        profileLines.push('Student is visual — use ASCII diagrams or numbered step-by-step breakdowns')
      }

      if (studentProfile.weakAreas?.length > 0) {
        profileLines.push(`Student weak areas: ${studentProfile.weakAreas.join(', ')} — be extra careful here`)
      }

      if (studentProfile.strongAreas?.length > 0) {
        profileLines.push(`Student strong areas: ${studentProfile.strongAreas.join(', ')} — use these as analogies`)
      }

      if (profileLines.length > 0) {
        systemPrompt += `\n\nSTUDENT PROFILE — adapt your entire response based on this:\n${profileLines.join('\n')}`
      }
    }

    // 4. Call Gemini with skill + profile enhanced prompt
    const reply = await chatWithMentor({
      systemPrompt,
      history: history || [],
      userMessage: userMessage.trim(),
    })

    return NextResponse.json({
      success: true,
      response: reply,
      skill: { id: skill.id, name: skill.name, icon: skill.icon, color: skill.color },
    })
  } catch (err) {
    console.error('chat error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Chat failed' }, { status: 500 })
  }
}