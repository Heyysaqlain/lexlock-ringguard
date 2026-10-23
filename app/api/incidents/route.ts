
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Incident = {
  id: string
  title: string
  category: string
  description: string
  sourceEventId: string | null
  status: 'new' | 'under_review' | 'closed'
  notes: string
  createdAt: string
  updatedAt: string
}

const dataDir = path.join(process.cwd(), 'data')
const filePath = path.join(dataDir, 'incidents.json')

async function readIncidents(): Promise<Incident[]> {
  try {
    const parsed = JSON.parse(await readFile(filePath, 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

async function saveIncidents(incidents: Incident[]) {
  await mkdir(dataDir, { recursive: true })
  await writeFile(filePath, JSON.stringify(incidents, null, 2), 'utf8')
}

export async function GET() {
  try {
    return NextResponse.json({ incidents: await readIncidents() })
  } catch {
    return NextResponse.json(
      { error: 'Failed to read incidents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const category =
      typeof body.category === 'string' ? body.category.trim() : ''
    const description =
      typeof body.description === 'string' ? body.description.trim() : ''
    const sourceEventId =
      typeof body.sourceEventId === 'string' ? body.sourceEventId : null

    if (!title || !category || !description) {
      return NextResponse.json(
        { error: 'Title, category and description are required' },
        { status: 400 }
      )
    }

    const incidents = await readIncidents()

    if (sourceEventId) {
      const existing = incidents.find(
        (item) => item.sourceEventId === sourceEventId
      )
      if (existing) {
        return NextResponse.json({ incident: existing, duplicate: true })
      }
    }

    const now = new Date().toISOString()

    const incident: Incident = {
      id: randomUUID(),
      title,
      category,
      description,
      sourceEventId,
      status: 'new',
      notes: '',
      createdAt: now,
      updatedAt: now,
    }

    incidents.unshift(incident)
    await saveIncidents(incidents)

    return NextResponse.json({ incident }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const id = typeof body.id === 'string' ? body.id : ''

    if (!id) {
      return NextResponse.json(
        { error: 'Incident ID is required' },
        { status: 400 }
      )
    }

    const incidents = await readIncidents()
    const index = incidents.findIndex((item) => item.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      )
    }

    if (body.status !== undefined) {
      if (!['new', 'under_review', 'closed'].includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid incident status' },
          { status: 400 }
        )
      }
      incidents[index].status = body.status
    }

    if (body.notes !== undefined) {
      if (typeof body.notes !== 'string' || body.notes.length > 10000) {
        return NextResponse.json(
          { error: 'Invalid notes' },
          { status: 400 }
        )
      }
      incidents[index].notes = body.notes
    }

    incidents[index].updatedAt = new Date().toISOString()
    await saveIncidents(incidents)

    return NextResponse.json({ incident: incidents[index] })
  } catch {
    return NextResponse.json(
      { error: 'Failed to update incident' },
      { status: 500 }
    )
  }
}
