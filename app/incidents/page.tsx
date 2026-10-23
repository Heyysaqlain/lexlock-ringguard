
'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

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

type Evidence = {
  id: string
  incidentId: string
  filename: string
  size: number
  sha256: string
  createdAt: string
}

type TimelineItem = {
  id: string
  type: string
  timestamp: string
  title: string
  details: string
  sha256?: string
}

type TimelineData = {
  incident: Incident
  evidence: Evidence[]
  visitors: unknown[]
  timeline: TimelineItem[]
}

const statusLabels: Record<Incident['status'], string> = {
  new: 'New',
  under_review: 'Under Review',
  closed: 'Closed',
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const loadIncidents = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/incidents', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load incidents')
      }

      const list: Incident[] = Array.isArray(data.incidents)
        ? data.incidents
        : []

      setIncidents(list)

      setSelectedId((current) => {
        if (current && list.some((item) => item.id === current)) {
          return current
        }
        return list[0]?.id || ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load incidents')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTimeline = useCallback(async (id: string) => {
    if (!id) {
      setTimelineData(null)
      return
    }

    setDetailsLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/incidents/${encodeURIComponent(id)}/timeline`,
        { cache: 'no-store' }
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load case timeline')
      }

      setTimelineData(data)
      setNotes(data.incident?.notes || '')
    } catch (err) {
      setTimelineData(null)
      setError(err instanceof Error ? err.message : 'Failed to load timeline')
    } finally {
      setDetailsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadIncidents()
  }, [loadIncidents])

  useEffect(() => {
    void loadTimeline(selectedId)
  }, [selectedId, loadTimeline])

  async function updateIncident(
    changes: Partial<Pick<Incident, 'status' | 'notes'>>
  ) {
    if (!selectedId) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/incidents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId, ...changes }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update incident')
      }

      await loadIncidents()
      await loadTimeline(selectedId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update incident')
    } finally {
      setSaving(false)
    }
  }

  function formatDate(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString('en-IN')
  }

  const selectedIncident = timelineData?.incident

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-cyan-400 text-sm font-semibold tracking-widest">
              LEXLOCK RINGGUARD
            </p>
            <h1 className="text-3xl font-bold mt-2">Incident Management</h1>
            <p className="text-slate-400 mt-2">
              Review cases, evidence integrity and incident timelines.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
          >
            ← Dashboard
          </Link>
        </header>

        {error && (
          <div role="alert" className="mb-5 rounded-lg bg-red-950 border border-red-800 p-3 text-red-300">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Incidents</p>
            <p className="text-3xl font-bold mt-2">{incidents.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">New / In Review</p>
            <p className="text-3xl font-bold text-amber-300 mt-2">
              {incidents.filter((item) => item.status !== 'closed').length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Closed Incidents</p>
            <p className="text-3xl font-bold text-emerald-300 mt-2">
              {incidents.filter((item) => item.status === 'closed').length}
            </p>
          </div>
        </section>

        {loading ? (
          <p className="text-slate-400">Loading incidents...</p>
        ) : incidents.length === 0 ? (
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h2 className="text-xl font-semibold">No incidents yet</h2>
            <p className="text-slate-400 mt-2">
              Create an incident from the Ring Events panel or send a simulated webhook event.
            </p>
            <Link
              href="/"
              className="inline-block mt-5 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-black"
            >
              Open Ring Dashboard
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
            <aside className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="font-semibold mb-4">Incident Records</h2>

              <div className="space-y-2">
                {incidents.map((incident) => (
                  <button
                    key={incident.id}
                    onClick={() => setSelectedId(incident.id)}
                    className={`w-full text-left rounded-lg border p-3 ${
                      selectedId === incident.id
                        ? 'border-cyan-400 bg-slate-800'
                        : 'border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <p className="font-medium break-words">{incident.title}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {formatDate(incident.createdAt)}
                    </p>
                    <span className="inline-block mt-2 text-xs rounded-full bg-slate-700 px-2 py-1">
                      {statusLabels[incident.status]}
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <section className="space-y-6 min-w-0">
              {detailsLoading ? (
                <div className="rounded-xl bg-slate-900 p-6 text-slate-400">
                  Loading case details...
                </div>
              ) : selectedIncident ? (
                <>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-cyan-400">INCIDENT DETAILS</p>
                        <h2 className="text-2xl font-bold mt-2 break-words">
                          {selectedIncident.title}
                        </h2>
                        <p className="text-sm text-slate-400 mt-2 break-all">
                          ID: {selectedIncident.id}
                        </p>
                      </div>

                      <a
                        href={`/api/incidents/${encodeURIComponent(selectedIncident.id)}/report`}
                        className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-300"
                      >
                        ↓ Download Report
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">
                      <div>
                        <p className="text-slate-400">Category</p>
                        <p className="mt-1">{selectedIncident.category}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Created</p>
                        <p className="mt-1">{formatDate(selectedIncident.createdAt)}</p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-sm text-slate-400 mb-2">Description</p>
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {selectedIncident.description || 'No description'}
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="incident-status" className="block text-sm text-slate-400 mb-2">
                          Incident Status
                        </label>
                        <select
                          id="incident-status"
                          value={selectedIncident.status}
                          disabled={saving}
                          onChange={(event) =>
                            void updateIncident({
                              status: event.target.value as Incident['status'],
                            })
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
                        >
                          <option value="new">New</option>
                          <option value="under_review">Under Review</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-5">
                      <label htmlFor="incident-notes" className="block text-sm text-slate-400 mb-2">
                        Case Notes
                      </label>
                      <textarea
                        id="incident-notes"
                        rows={4}
                        maxLength={10000}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
                        placeholder="Add investigation notes..."
                      />
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void updateIncident({ notes })}
                        className="mt-3 rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Notes'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                    <h2 className="text-xl font-semibold mb-5">Case Timeline</h2>

                    {!timelineData?.timeline?.length ? (
                      <p className="text-sm text-slate-400">
                        No timeline entries available.
                      </p>
                    ) : (
                      <div className="space-y-5">
                        {timelineData.timeline.map((item) => (
                          <div key={item.id} className="relative border-l-2 border-cyan-700 pl-5 pb-2">
                            <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-cyan-400" />
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-slate-400 mt-1 whitespace-pre-wrap break-words">
                              {item.details}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                              {formatDate(item.timestamp)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Linked Evidence ({timelineData?.evidence?.length || 0})
                    </h2>

                    {!timelineData?.evidence?.length ? (
                      <p className="text-sm text-slate-400">
                        No evidence is linked to this incident yet. Upload evidence from the Evidence Vault using this incident ID.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {timelineData.evidence.map((item) => (
                          <article key={item.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                            <p className="font-medium break-words">{item.filename}</p>
                            <p className="text-xs text-slate-400 mt-2">
                              {item.size.toLocaleString()} bytes · {formatDate(item.createdAt)}
                            </p>
                            <p className="text-xs text-slate-400 mt-3">SHA-256</p>
                            <code className="block text-xs text-cyan-300 break-all mt-1">
                              {item.sha256}
                            </code>
                          </article>
                        ))}
                      </div>
                    )}

                    <Link
                      href="/evidence"
                      className="inline-block mt-5 rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
                    >
                      Open Evidence Vault
                    </Link>
                  </div>
                </>
              ) : null}
            </section>
          </div>
        )}

        <footer className="text-center text-xs text-slate-600 mt-10">
          LexLock RingGuard · Incident records and evidence integrity
        </footer>
      </div>
    </main>
  )
}
