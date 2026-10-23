
'use client'

import { useEffect, useState } from 'react'
import { DetectionEvent } from './EventCard'

type Incident = {
  id: string
  title: string
  sourceEventId: string | null
}

interface EventPanelProps {
  events: DetectionEvent[]
  webhookUrl: string
}

export function EventPanel({ events, webhookUrl }: EventPanelProps) {
  const [created, setCreated] = useState<Record<string, Incident>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadIncidents() {
      try {
        const response = await fetch('/api/incidents', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        if (cancelled) return

        const map: Record<string, Incident> = {}
        for (const incident of data.incidents || []) {
          if (incident.sourceEventId) {
            map[incident.sourceEventId] = incident
          }
        }
        setCreated(map)
      } catch {
        // Dashboard remains usable if incident loading fails.
      }
    }

    loadIncidents()
    return () => { cancelled = true }
  }, [])

  async function createIncident(event: DetectionEvent) {
    setLoading(event.event_id)
    setMessage('')

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Security event: ${event.event_type}`,
          category: 'Ring Security Event',
          description: [
            `Event type: ${event.event_type}`,
            `Timestamp: ${event.timestamp}`,
            `Confidence: ${event.confidence ?? 'Not provided'}`,
            `Metadata: ${JSON.stringify(event.metadata ?? {})}`,
          ].join('\n'),
          sourceEventId: event.event_id,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not create incident')
      }

      setCreated(previous => ({
        ...previous,
        [event.event_id]: data.incident,
      }))
      setMessage(
        data.duplicate
          ? 'Existing incident opened for this event.'
          : 'Incident created successfully.'
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Ring Security Events</h2>
          <p className="text-sm text-gray-500">
            {events.length} event(s) received
          </p>
        </div>
        <button
          className="rounded-lg border px-3 py-2 text-sm"
          onClick={() => window.open(webhookUrl, '_blank', 'noopener,noreferrer')}
        >
          Webhook details
        </button>
      </div>

      {message && (
        <p role="status" className="mb-3 rounded-md bg-blue-50 p-3 text-sm">
          {message}
        </p>
      )}

      {events.length === 0 ? (
        <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          No events received yet. Events appear when the Ring webhook delivers
          them or a simulated test event is sent.
        </p>
      ) : (
        <div className="space-y-3">
          {events.map(event => {
            const incident = created[event.event_id]

            return (
              <article
                key={event.event_id}
                className="rounded-lg border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{event.event_type}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    <p className="mt-1 break-all text-xs text-gray-500">
                      Event ID: {event.event_id}
                    </p>
                    {event.confidence !== null && (
                      <p className="mt-1 text-sm">
                        Confidence: {(event.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>

                  {incident ? (
                    <a
                      href="/incidents"
                      className="rounded-lg bg-green-700 px-3 py-2 text-sm text-white"
                    >
                      Open Incident
                    </a>
                  ) : (
                    <button
                      disabled={loading === event.event_id}
                      onClick={() => createIncident(event)}
                      className="rounded-lg bg-blue-700 px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {loading === event.event_id
                        ? 'Creating...'
                        : 'Create Incident'}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
