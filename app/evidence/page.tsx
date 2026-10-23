
'use client'

import { useEffect, useState } from 'react'

type Incident = {
  id: string
  title: string
}

type Evidence = {
  id: string
  incidentId: string
  filename: string
  mimeType: string
  size: number
  sha256: string
  createdAt: string
}

type VerifyResult = {
  originalHash: string
  currentHash: string
  intact: boolean
  verifiedAt: string
}

export default function EvidenceVaultPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [incidentId, setIncidentId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [verification, setVerification] = useState<Record<string, VerifyResult>>({})

  async function loadData() {
    const [incidentResponse, evidenceResponse] = await Promise.all([
      fetch('/api/incidents', { cache: 'no-store' }),
      fetch('/api/evidence', { cache: 'no-store' }),
    ])

    if (incidentResponse.ok) {
      const data = await incidentResponse.json()
      setIncidents(data.incidents || [])
    }

    if (evidenceResponse.ok) {
      const data = await evidenceResponse.json()
      setEvidence(data.evidence || [])
    }
  }

  useEffect(() => {
    loadData().catch(() => setMessage('Could not load vault records.'))
  }, [])

  async function uploadEvidence(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file || !incidentId) {
      setMessage('Select an incident and a file first.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('incidentId', incidentId)

      const response = await fetch('/api/evidence', {
        method: 'POST',
        body: form,
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setMessage(`Evidence uploaded. SHA-256: ${data.evidence.sha256}`)
      setFile(null)
      await loadData()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  async function verifyEvidence(id: string) {
    setMessage('Verifying file integrity...')

    try {
      const response = await fetch(`/api/evidence/${id}/verify`, {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      setVerification(previous => ({ ...previous, [id]: data }))
      setMessage(data.intact
        ? 'Integrity check passed: SHA-256 hashes match.'
        : 'WARNING: SHA-256 hashes do not match.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Verification failed')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-cyan-400">LEXLOCK RINGGUARD</p>
            <h1 className="text-3xl font-bold">Evidence Vault</h1>
            <p className="mt-1 text-slate-400">
              Upload evidence, calculate SHA-256 and verify file integrity.
            </p>
          </div>
          <a
            href="/"
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            Back to Dashboard
          </a>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-xl font-semibold">Upload Evidence</h2>

          <form onSubmit={uploadEvidence} className="space-y-4">
            <label className="block text-sm">
              Link to incident
              <select
                value={incidentId}
                onChange={event => setIncidentId(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
                required
              >
                <option value="">Select an incident...</option>
                {incidents.map(incident => (
                  <option key={incident.id} value={incident.id}>
                    {incident.title} — {incident.id}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              Evidence file (maximum 15 MB)
              <input
                type="file"
                onChange={event => setFile(event.target.files?.[0] || null)}
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
                required
              />
            </label>

            {file && (
              <p className="text-sm text-slate-400">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !file || !incidentId}
              className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload & Calculate SHA-256'}
            </button>
          </form>

          {message && (
            <p role="status" className="mt-4 break-words rounded-lg bg-slate-800 p-3 text-sm">
              {message}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Stored Evidence</h2>
            <button
              onClick={() => loadData().catch(() => setMessage('Refresh failed.'))}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>

          {evidence.length === 0 ? (
            <p className="text-slate-400">No evidence files uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {evidence.map(item => {
                const result = verification[item.id]

                return (
                  <article key={item.id} className="rounded-lg border border-slate-700 p-4">
                    <h3 className="break-words font-semibold">{item.filename}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Evidence ID: {item.id}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-400">
                      Incident ID: {item.incidentId}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {(item.size / 1024).toFixed(1)} KB · {item.mimeType}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">SHA-256 fingerprint</p>
                    <code className="mt-1 block break-all rounded bg-slate-950 p-3 text-xs text-cyan-300">
                      {item.sha256}
                    </code>

                    <button
                      onClick={() => verifyEvidence(item.id)}
                      className="mt-3 rounded-lg border border-cyan-700 px-4 py-2 text-sm hover:bg-slate-800"
                    >
                      Verify Integrity
                    </button>

                    {result && (
                      <div className="mt-3 space-y-2 rounded-lg bg-slate-950 p-3 text-xs">
                        <p className={result.intact ? 'text-green-400' : 'text-red-400'}>
                          {result.intact ? 'HASH MATCH — file bytes unchanged' : 'HASH MISMATCH — investigate'}
                        </p>
                        <p className="break-all">Current hash: {result.currentHash}</p>
                        <p className="text-slate-400">
                          Verified: {new Date(result.verifiedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
