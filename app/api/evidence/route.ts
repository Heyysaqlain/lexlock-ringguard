
import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, writeFile, readFile, appendFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATA_DIR = path.join(process.cwd(), 'data')
const FILE_DIR = path.join(DATA_DIR, 'evidence')
const META_FILE = path.join(DATA_DIR, 'evidence.json')
const MAX_BYTES = 15 * 1024 * 1024

type Evidence = {
  id: string
  incidentId: string
  filename: string
  storedFilename: string
  mimeType: string
  size: number
  sha256: string
  createdAt: string
}

async function getRecords(): Promise<Evidence[]> {
  try {
    return JSON.parse(await readFile(META_FILE, 'utf8'))
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  const incidentId = request.nextUrl.searchParams.get('incidentId')
  const records = await getRecords()
  return NextResponse.json({
    evidence: incidentId
      ? records.filter(item => item.incidentId === incidentId)
      : records
  })
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file')
    const incidentId = String(form.get('incidentId') || '').trim()

    if (!(file instanceof File) || !incidentId) {
      return NextResponse.json(
        { error: 'file and incidentId are required' },
        { status: 400 }
      )
    }

    if (file.size === 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'File must be between 1 byte and 15 MB' },
        { status: 413 }
      )
    }

    await mkdir(FILE_DIR, { recursive: true })
    const bytes = new Uint8Array(await file.arrayBuffer())
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    const id = randomUUID()
    const storedFilename = `${id}.bin`

    await writeFile(path.join(FILE_DIR, storedFilename), bytes, {
      flag: 'wx'
    })

    const record: Evidence = {
      id,
      incidentId,
      filename: path.basename(file.name),
      storedFilename,
      mimeType: file.type || 'application/octet-stream',
      size: bytes.length,
      sha256,
      createdAt: new Date().toISOString()
    }

    const records = await getRecords()
    records.push(record)
    await writeFile(META_FILE, JSON.stringify(records, null, 2))

    return NextResponse.json({ evidence: record }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Evidence upload failed' },
      { status: 500 }
    )
  }
}
