
'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

type Visitor = {
  id: string
  name: string
  purpose: string
  personToVisit: string
  entryTime: string
  exitTime: string | null
  notes: string
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [personToVisit, setPersonToVisit] = useState('')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadVisitors = useCallback(async () => {
    try {
      setError('')
      const response = await fetch('/api/visitors', {
        cache: 'no-store',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not load visitors')
      }

      setVisitors(Array.isArray(data.visitors) ? data.visitors : [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load visitors'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadVisitors()
  }, [loadVisitors])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          purpose,
          personToVisit,
          notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not register visitor')
      }

      setName('')
      setPurpose('')
      setPersonToVisit('')
      setNotes('')
      setMessage('Visitor entry saved successfully.')
      await loadVisitors()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not register visitor'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleExit(id: string) {
    setError('')
    setMessage('')

    try {
      const response = await fetch(`/api/visitors/${id}/exit`, {
        method: 'PATCH',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not mark visitor exit')
      }

      setVisitors((current) =>
        current.map((visitor) =>
          visitor.id === id ? data.visitor : visitor
        )
      )
      setMessage('Visitor exit recorded.')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not mark visitor exit'
      )
    }
  }

  const filteredVisitors = visitors.filter((visitor) => {
    const query = search.toLowerCase()

    return [
      visitor.name,
      visitor.purpose,
      visitor.personToVisit,
      visitor.id,
    ].some((value) => value.toLowerCase().includes(query))
  })

  const activeCount = visitors.filter((visitor) => !visitor.exitTime).length

  function formatDate(value: string) {
    const date = new Date(value)

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-cyan-400 text-sm font-semibold tracking-widest">
              LEXLOCK RINGGUARD
            </p>
            <h1 className="text-3xl font-bold mt-2">Visitor Log</h1>
            <p className="text-slate-400 mt-2">
              Register visitors and track their entry and exit.
            </p>
          </div>

          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
          >
            ← Back to Dashboard
          </Link>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Visitors</p>
            <p className="text-3xl font-bold mt-2">{visitors.length}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Currently Inside</p>
            <p className="text-3xl font-bold text-cyan-400 mt-2">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Checked Out</p>
            <p className="text-3xl font-bold mt-2">
              {visitors.length - activeCount}
            </p>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-800 bg-red-950 p-3 text-red-300"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950 p-3 text-emerald-300"
          >
            {message}
          </div>
        )}

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6 mb-8">
          <h2 className="text-xl font-semibold mb-5">Register New Visitor</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="visitor-name" className="block text-sm text-slate-300 mb-2">
                  Visitor Name *
                </label>
                <input
                  id="visitor-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={120}
                  placeholder="Enter visitor name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label htmlFor="visitor-purpose" className="block text-sm text-slate-300 mb-2">
                  Visit Purpose *
                </label>
                <input
                  id="visitor-purpose"
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  required
                  maxLength={300}
                  placeholder="Meeting, delivery, appointment..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="person-to-visit" className="block text-sm text-slate-300 mb-2">
                  Person / Department to Visit *
                </label>
                <input
                  id="person-to-visit"
                  value={personToVisit}
                  onChange={(event) => setPersonToVisit(event.target.value)}
                  required
                  maxLength={120}
                  placeholder="Employee name or department"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="visitor-notes" className="block text-sm text-slate-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="visitor-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Additional details..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
            >
              {saving ? 'Saving...' : '+ Register Visitor'}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <h2 className="text-xl font-semibold">Visitor Records</h2>

            <input
              aria-label="Search visitors"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search visitors..."
              className="w-full sm:w-64 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400"
            />
          </div>

          {loading ? (
            <p className="text-slate-400 py-8 text-center">
              Loading visitor records...
            </p>
          ) : filteredVisitors.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-300 font-medium">No visitor records found</p>
              <p className="text-slate-500 text-sm mt-2">
                Register a visitor using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVisitors.map((visitor) => (
                <article
                  key={visitor.id}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg break-words">
                        {visitor.name}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Purpose: {visitor.purpose}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Visiting: {visitor.personToVisit}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        visitor.exitTime
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-emerald-950 text-emerald-300'
                      }`}
                    >
                      {visitor.exitTime ? 'Checked Out' : 'Inside'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                    <p>Entry: {formatDate(visitor.entryTime)}</p>
                    <p>
                      Exit:{' '}
                      {visitor.exitTime
                        ? formatDate(visitor.exitTime)
                        : 'Not recorded'}
                    </p>
                    <p className="sm:col-span-2 break-all">
                      Visitor ID: {visitor.id}
                    </p>
                  </div>

                  {visitor.notes && (
                    <p className="mt-3 text-sm text-slate-300 whitespace-pre-wrap break-words">
                      Notes: {visitor.notes}
                    </p>
                  )}

                  {!visitor.exitTime && (
                    <button
                      type="button"
                      onClick={() => void handleExit(visitor.id)}
                      className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
                    >
                      Mark Exit
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="text-center text-xs text-slate-600 mt-8">
          LexLock RingGuard · Visitor Management
        </footer>
      </div>
    </main>
  )
}
