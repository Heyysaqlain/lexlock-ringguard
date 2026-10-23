
import { NextResponse } from 'next/server'
import { markVisitorExit } from '@/lib/visitor-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const visitor = await markVisitorExit(id)

    if (!visitor) {
      return NextResponse.json(
        { error: 'Visitor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ visitor })
  } catch {
    return NextResponse.json(
      { error: 'Failed to mark visitor exit' },
      { status: 500 }
    )
  }
}
