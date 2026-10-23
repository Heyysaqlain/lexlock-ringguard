
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), 'data')
const FILE_PATH = path.join(DATA_DIR, 'visitors.json')

export type Visitor = {
  id: string
  name: string
  purpose: string
  personToVisit: string
  entryTime: string
  exitTime: string | null
  notes: string
}

async function readVisitors(): Promise<Visitor[]> {
  try {
    const data = JSON.parse(await readFile(FILE_PATH, 'utf8'))
    return Array.isArray(data) ? data : []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

async function saveVisitors(visitors: Visitor[]) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(visitors, null, 2), 'utf8')
}

export async function listVisitors() {
  return readVisitors()
}

export async function addVisitor(input: {
  name: string
  purpose: string
  personToVisit: string
  notes?: string
}) {
  const visitors = await readVisitors()
  const now = new Date().toISOString()

  const visitor: Visitor = {
    id: randomUUID(),
    name: input.name.trim(),
    purpose: input.purpose.trim(),
    personToVisit: input.personToVisit.trim(),
    entryTime: now,
    exitTime: null,
    notes: (input.notes || '').trim(),
  }

  visitors.unshift(visitor)
  await saveVisitors(visitors)
  return visitor
}

export async function markVisitorExit(id: string) {
  const visitors = await readVisitors()
  const index = visitors.findIndex((visitor) => visitor.id === id)

  if (index === -1) return null

  if (!visitors[index].exitTime) {
    visitors[index].exitTime = new Date().toISOString()
    await saveVisitors(visitors)
  }

  return visitors[index]
}
