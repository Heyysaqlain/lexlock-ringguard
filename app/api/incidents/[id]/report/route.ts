
import { NextResponse } from 'next/server'
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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [incidents, evidence] = await Promise.all([
    readJson('incidents.json'),
    readJson('evidence.json'),
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

  const lines = [
    'LEXLOCK RINGGUARD — INCIDENT REPORT',
    '===================================',
    '',
    `Incident ID: ${incident.id}`,
    `Title: ${incident.title}`,
    `Category: ${incident.category}`,
    `Status: ${incident.status}`,
    `Created: ${incident.createdAt}`,
    `Last Updated: ${incident.updatedAt}`,
    '',
    'DESCRIPTION',
    '-----------',
    incident.description || 'No description provided',
    '',
    'NOTES',
    '-----',
    incident.notes || 'No notes provided',
    '',
    `LINKED EVIDENCE (${linkedEvidence.length})`,
    '----------------',
    ...linkedEvidence.flatMap((item, index) => [
      `${index + 1}. ${item.filename}`,
      `   Evidence ID: ${item.id}`,
      `   SHA-256: ${item.sha256}`,
      `   Size: ${item.size} bytes`,
      `   Added: ${item.createdAt}`,
      '',
    ]),
    'INTEGRITY NOTICE',
    '----------------',
    'SHA-256 values are recorded for integrity comparison.',
    'This report does not independently establish authenticity',
    'or legal admissibility of the evidence.',
    '',
    `Report generated: ${new Date().toISOString()}`,
  ]

  const report = lines.join('\n')

  return new Response(report, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition':
        `attachment; filename="incident-${id}.txt"`,
      'Cache-Control': 'no-store',
    },
  })
}
