
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const metaPath = path.join(process.cwd(), 'data', 'evidence.json')
    const records = JSON.parse(await readFile(metaPath, 'utf8'))
    const record = records.find((item: { id: string }) => item.id === id)

    if (!record) {
      return NextResponse.json(
        { error: 'Evidence not found' },
        { status: 404 }
      )
    }

    const filePath = path.join(
      process.cwd(),
      'data',
      'evidence',
      path.basename(record.storedFilename)
    )

    const fileContents = await readFile(filePath)
    const bytes = new Uint8Array(fileContents)
    const currentHash = createHash('sha256')
      .update(bytes)
      .digest('hex')

    return NextResponse.json({
      evidenceId: id,
      originalHash: record.sha256,
      currentHash,
      intact: currentHash === record.sha256,
      verifiedAt: new Date().toISOString()
    })
  } catch {
    return NextResponse.json(
      { error: 'Evidence verification failed' },
      { status: 500 }
    )
  }
}
