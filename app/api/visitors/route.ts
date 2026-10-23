
import { NextRequest, NextResponse } from 'next/server'
import { addVisitor, listVisitors } from '@/lib/visitor-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const visitors = await listVisitors()
    return NextResponse.json({ visitors })
  } catch {
    return NextResponse.json(
      { error: 'Failed to load visitors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const purpose = typeof body.purpose === 'string' ? body.purpose.trim() : ''
    const personToVisit =
      typeof body.personToVisit === 'string'
        ? body.personToVisit.trim()
        : ''
    const notes = typeof body.notes === 'string' ? body.notes : ''

    if (!name || !purpose || !personToVisit) {
      return NextResponse.json(
        { error: 'Name, purpose and person to visit are required' },
        { status: 400 }
      )
    }

    if (name.length > 120 || purpose.length > 300 ||
        personToVisit.length > 120 || notes.length > 2000) {
      return NextResponse.json(
        { error: 'One or more fields exceed the allowed length' },
        { status: 400 }
      )
    }

    const visitor = await addVisitor({
      name,
      purpose,
      personToVisit,
      notes,
    })

    return NextResponse.json({ visitor }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create visitor entry' },
      { status: 500 }
    )
  }
}
