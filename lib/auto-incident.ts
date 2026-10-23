
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const dataDir = path.join(process.cwd(), 'data')
const dataFile = path.join(dataDir, 'incidents.json')

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

type RingEvent = {
  event_id: string
  event_type: string
  timestamp?: string
  device_id?: string | null
  confidence?: number | null
  metadata?: Record<string, unknown>
  raw?: unknown
}

export async function createIncidentFromEvent(event: RingEvent) {
  await mkdir(dataDir, { recursive: true })

  let incidents: Incident[] = []

  try {
    incidents = JSON.parse(await readFile(dataFile, 'utf8'))
    if (!Array.isArray(incidents)) incidents = []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }

  // Prevent duplicate incidents for the same source event.
  const existing = incidents.find(
    item => item.sourceEventId === event.event_id
  )
  if (existing) return existing

  const now = new Date().toISOString()
  const incident: Incident = {
    id: randomUUID(),
    title: `Security event: ${event.event_type}`,
    category: 'Ring Security Event',
    description: [
      `Event type: ${event.event_type}`,
      `Device: ${event.device_id || 'Unknown'}`,
      `Event timestamp: ${event.timestamp || now}`,
      `Confidence: ${event.confidence ?? 'Not provided'}`,
      `Source: ${event.metadata?.simulated === true ? 'Simulated demo event' : 'Ring webhook'}`,
    ].join('\n'),
    sourceEventId: event.event_id,
    status: 'new',
    notes: '',
    createdAt: now,
    updatedAt: now,
  }

  incidents.unshift(incident)
  await writeFile(dataFile, JSON.stringify(incidents, null, 2), 'utf8')
  return incident
}
