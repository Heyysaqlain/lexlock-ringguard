
'use client'

import { memo } from 'react'


interface EventCardProps {
  event: DetectionEvent
  expanded: boolean
  onToggle: () => void
  onCreateIncident: () => void
  creating: boolean
  created: boolean
}

export interface DetectionEvent {
  event_id: string
  event_type: string
  timestamp: string
  confidence: number | null
  bounding_box: {
    x: number
    y: number
    width: number
    height: number
  } | null
  thumbnail_url: string | null
  metadata: Record<string, unknown>
  raw: unknown
}

export const EventCard = memo(function EventCard({
  event,
  expanded,
  onToggle,
  onCreateIncident,
  creating,
  created,
}: EventCardProps) {
  return (
    <div
      className="card transition hover:border-slate-500"
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            event.event_type === 'person_detected'
              ? 'bg-cyan-400'
              : 'bg-green-400'
          }`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="break-words text-sm font-medium text-white">
              {event.event_type.replace(/_/g, ' ')}
            </span>

            {event.confidence !== null &&
              event.confidence !== undefined && (
                <span className="text-xs text-slate-400">
                  {(event.confidence * 100).toFixed(0)}%
                </span>
              )}
          </div>

          <p className="text-xs text-slate-500">
            {new Date(event.timestamp).toLocaleString()}
          </p>
        </div>

        {event.thumbnail_url && (
          <img
            src={event.thumbnail_url}
            alt="Event thumbnail"
            className="h-10 w-10 rounded object-cover"
          />
        )}
      </div>

      {expanded && (
        <div className="mt-3" onClick={e => e.stopPropagation()}>
          <pre className="max-h-48 overflow-x-auto rounded bg-slate-950 p-2 font-mono text-xs text-cyan-300">
            {JSON.stringify(event.raw, null, 2)}
          </pre>

          <button
            type="button"
            disabled={creating || created}
            onClick={e => {
              e.stopPropagation()
              onCreateIncident()
            }}
            className="mt-3 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {created
              ? '✓ Incident Created'
              : creating
                ? 'Creating...'
                : '+ Create Incident'}
          </button>
        </div>
      )}
    </div>
  )
})
