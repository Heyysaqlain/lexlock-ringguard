
import { NextRequest, NextResponse } from 'next/server'
import {
  broadcastEvent,
  eventStore,
  addClient,
  removeClient,
} from '@/lib/sse-broadcast'
import { parseRingWebhook } from '@/lib/schemas/webhook'
import { createIncidentFromEvent } from '@/lib/auto-incident'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const processedRequests = new Set<string>()
const MAX_PROCESSED_IDS = 1000

type NormalizedEvent = {
  event_id: string
  event_type: string
  timestamp: string
  device_id: string | null
  confidence: number | null
  bounding_box: unknown
  thumbnail_url: string | null
  metadata: Record<string, unknown>
  raw: unknown
}

function normalizeRingEvent(body: any): NormalizedEvent {
  const { meta, data } = body
  const attributes = data.attributes || {}

  const rawTimestamp =
    typeof attributes.timestamp === 'number'
      ? new Date(attributes.timestamp).toISOString()
      : attributes.timestamp || meta.time || new Date().toISOString()

  return {
    event_id: String(data.id || `evt_${Date.now()}`),
    event_type: String(data.type || 'unknown'),
    timestamp: String(rawTimestamp),
    device_id: attributes.source ? String(attributes.source) : null,
    confidence: typeof attributes.confidence === 'number'
      ? attributes.confidence
      : null,
    bounding_box: attributes.bounding_box ?? null,
    thumbnail_url: attributes.thumbnail_url ?? null,
    metadata: {
      ring_version: meta.version,
      ring_time: meta.time,
      request_id: meta.request_id,
      source_type: attributes.source_type,
      device_link: data.relationships?.devices?.links?.self,
    },
    raw: body,
  }
}

function normalizeGenericEvent(body: any): NormalizedEvent {
  return {
    event_id: String(body.event_id || body.id || `evt_${Date.now()}`),
    event_type: String(body.event_type || body.type || 'unknown'),
    timestamp: String(body.timestamp || new Date().toISOString()),
    device_id: body.device_id ? String(body.device_id) : null,
    confidence: typeof body.confidence === 'number' ? body.confidence : null,
    bounding_box: body.bounding_box ?? null,
    thumbnail_url: body.thumbnail_url ?? null,
    metadata:
      body.metadata && typeof body.metadata === 'object'
        ? body.metadata
        : {},
    raw: body,
  }
}

export async function POST(request: NextRequest) {
  try {
    const expectedToken = process.env.RING_WEBHOOK_SECRET
    const authHeader = request.headers.get('Authorization')

    if (
      expectedToken &&
      authHeader !== `Bearer ${expectedToken}`
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    const requestId =
      typeof body.meta?.request_id === 'string'
        ? body.meta.request_id
        : null

    if (requestId && processedRequests.has(requestId)) {
      return NextResponse.json({
        status: 'already_processed',
        request_id: requestId,
      })
    }

    const parsed = parseRingWebhook(body)
    const event: NormalizedEvent = parsed.success
      ? normalizeRingEvent(body)
      : normalizeGenericEvent(body)

    if (!parsed.success) {
      console.log('[WEBHOOK] Using generic event normalization')
    }

    // Create the incident first so failures are not silently ignored.
    const incident = await createIncidentFromEvent(event)

    // Broadcast only after incident creation succeeds.
    broadcastEvent(event)

    if (requestId) {
      processedRequests.add(requestId)

      if (processedRequests.size > MAX_PROCESSED_IDS) {
        const oldestIds = Array.from(processedRequests).slice(0, 100)
        oldestIds.forEach((id) => processedRequests.delete(id))
      }
    }

    return NextResponse.json({
      status: 'processed',
      event_id: event.event_id,
      incident_id: incident.id,
    })
  } catch (error) {
    console.error('[WEBHOOK] Processing failed:', error)

    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      addClient(controller)
      controller.enqueue(encoder.encode(': connected\n\n'))

      for (const event of eventStore) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        )
      }

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(keepAlive)
          removeClient(controller)
        }
      }, 30000)

      ;(controller as any)._keepAlive = keepAlive
    },

    cancel(controller) {
      removeClient(controller)

      const keepAlive = (controller as any)._keepAlive
      if (keepAlive) clearInterval(keepAlive)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
