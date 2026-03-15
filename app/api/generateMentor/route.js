import { NextResponse } from 'next/server'
import { generateMentorProfile } from '@/lib/gemini'
import { buildTokenURI } from '@/lib/ipfs'

export async function POST(request) {
  try {
    const body = await request.json()
    const { studentNeeds } = body

    if (!studentNeeds || studentNeeds.trim().length < 8) {
      return NextResponse.json(
        { success: false, error: 'Please describe your needs in at least 8 characters.' },
        { status: 400 }
      )
    }

    const mentor = await generateMentorProfile(studentNeeds.trim())
    const tokenURI = buildTokenURI(mentor)

    return NextResponse.json({ success: true, mentor, tokenURI })
  } catch (err) {
    console.error('generateMentor error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate mentor' },
      { status: 500 }
    )
  }
}
