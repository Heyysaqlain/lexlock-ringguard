
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function readJson(filename: string): Promise<any[]> {
  try {
    const data = JSON.parse(
      await readFile(path.join(process.cwd(), 'data', filename), 'utf8')
    )
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [incidents, evidence, visitors] = await Promise.all([
    readJson('incidents.json'),
    readJson('evidence.json'),
    readJson('visitors.json'),
  ])

  const incident = incidents.find((item) => item.id === id)

  if (!incident) {
    return NextResponse.json(
      { error: 'Incident not found' },
      { status: 404 }
    )
  }

  const linkedEvidence = evidence.filter(
    (item) => item.incidentId === id
  )

  const timeline = [
    {
      id: `incident-${incident.id}`,
      type: 'incident_created',
      timestamp: incident.createdAt,
      title: 'Incident created',
      details: incident.title,
    },
    ...linkedEvidence.map((item) => ({
      id: `evidence-${item.id}`,
      type: 'evidence_added',
      timestamp: item.createdAt,
      title: 'Evidence added',
      details: item.filename,
      sha256: item.sha256,
    })),
  ].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() -
      new Date(b.timestamp).getTime()
  )

  return NextResponse.json({
    incident,
    evidence: linkedEvidence,
    visitors,
    timeline,
  })
}
