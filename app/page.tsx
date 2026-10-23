
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useVideoProcessing } from '@/lib/video-processors/useVideoProcessing'
import '@/lib/video-processors'

import { Header } from './components/Header'
import { EventPanel } from './components/EventPanel'
import { ProcessorPanel } from './components/ProcessorPanel'
import { useWebRTCStream } from './hooks/useWebRTCStream'
import { useEventStream } from './hooks/useEventStream'
import { useCanvasOverlay } from './hooks/useCanvasOverlay'

type RightPanelTab = 'events' | 'processors'
type AuthMode = 'access_token' | 'refresh_token' | null

export default function Dashboard() {
  const [rightPanelTab, setRightPanelTab] =
    useState<RightPanelTab>('events')

  const [webhookUrl, setWebhookUrl] = useState('')
  const [deviceId, setDeviceId] = useState<string | undefined>()
  const [deviceError, setDeviceError] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetch('/api/ring/config')
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to load Ring configuration')
        }
        setAuthMode(data.mode)
      })
      .catch((err) => {
        setAuthError(
          err instanceof Error ? err.message : 'Configuration error'
        )
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!authMode) return

    fetch('/api/ring/devices')
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to discover Ring devices')
        }

        if (data.devices?.length > 0) {
          setDeviceId(data.devices[0].id)
          setDeviceError(null)
        } else {
          setDeviceError(data.error || 'No Ring devices found')
        }
      })
      .catch((err) => {
        setDeviceError(
          err instanceof Error ? err.message : 'Device discovery failed'
        )
      })
  }, [authMode])

  const { streamActive, streamError, startStream, stopStream } =
    useWebRTCStream({ videoRef, deviceId })

  const { events, connected } = useEventStream({})

  const { processors, results, toggleProcessor, enabledCount } =
    useVideoProcessing({
      video: videoRef.current,
      canvas: canvasRef.current,
      enabled: streamActive,
      fps: 10,
    })

  useCanvasOverlay({ videoRef, canvasRef, events, results })

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhook`)
  }, [])

  const isSimpleMode = authMode === 'access_token'

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-dash-bg">
        <p className="text-slate-400">Loading RingGuard...</p>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="h-screen flex items-center justify-center bg-dash-bg p-6">
        <div className="text-center max-w-md">
          <p className="text-red-400 text-lg font-medium mb-2">
            Configuration Error
          </p>
          <p className="text-slate-400">{authError}</p>
          <p className="text-slate-500 text-sm mt-3">
            Check your local Ring configuration. Do not share your access token.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-dash-bg text-white">
      <Header
        connected={isSimpleMode ? false : connected}
        enabledCount={isSimpleMode ? 0 : enabledCount}
        simpleMode={isSimpleMode}
      />

      <main className="flex-1 flex min-h-0">
        {/* Existing Ring camera stream */}
        <section className="w-[60%] min-w-0 p-4 flex flex-col">
          <div className="relative flex-1 min-h-[260px] bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />

            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {!streamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                <button
                  onClick={startStream}
                  disabled={!deviceId}
                  className={`px-6 py-3 font-bold rounded-lg transition ${
                    deviceId
                      ? 'bg-dash-cyan text-black hover:bg-cyan-300'
                      : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {deviceId
                    ? '▶ Start Live Stream'
                    : '⏳ Discovering device...'}
                </button>

                {streamError && (
                  <p className="text-red-400 text-sm">{streamError}</p>
                )}

                {deviceError && (
                  <p className="text-red-400 text-sm">{deviceError}</p>
                )}
              </div>
            )}

            {streamActive && (
              <button
                onClick={stopStream}
                className="absolute top-3 right-3 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500"
              >
                ■ Stop
              </button>
            )}
          </div>

          {!isSimpleMode && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <span>Webhook URL:</span>

              <code className="bg-dash-card px-2 py-1 rounded text-slate-300 flex-1 truncate">
                {webhookUrl}
              </code>

              <button
                onClick={() => {
                  if (webhookUrl) {
                    navigator.clipboard.writeText(webhookUrl).catch(() => {
                      setAuthError('Could not copy webhook URL')
                    })
                  }
                }}
                className="px-2 py-1 bg-dash-card rounded hover:bg-slate-600 text-slate-400"
              >
                Copy
              </button>
            </div>
          )}
        </section>

        {/* Security modules */}
        <aside className="w-[40%] min-w-0 border-l border-slate-700 flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-slate-700">
            <p className="text-xs text-slate-400 mb-3">
              LEXLOCK SECURITY MODULES
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRightPanelTab('events')}
                className={`px-3 py-2 rounded-lg text-xs ${
                  rightPanelTab === 'events'
                    ? 'bg-cyan-400 text-black font-semibold'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                Ring Events
              </button>

              {!isSimpleMode && (
                <button
                  onClick={() => setRightPanelTab('processors')}
                  className={`px-3 py-2 rounded-lg text-xs ${
                    rightPanelTab === 'processors'
                      ? 'bg-cyan-400 text-black font-semibold'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  Processors ({enabledCount})
                </button>
              )}

              <Link
                href="/visitors"
                className="px-3 py-2 rounded-lg text-xs bg-slate-800 text-white hover:bg-slate-700"
              >
                Visitor Log
              </Link>

              <Link
                href="/evidence"
                className="px-3 py-2 rounded-lg text-xs bg-slate-800 text-white hover:bg-slate-700"
              >
                Evidence Vault
              </Link>

              <Link
                href="/incidents"
                className="px-3 py-2 rounded-lg text-xs bg-slate-800 text-white hover:bg-slate-700"
              >
                Incidents
              </Link>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {rightPanelTab === 'events' || isSimpleMode ? (
              <EventPanel events={events} webhookUrl={webhookUrl} />
            ) : (
              <ProcessorPanel
                processors={processors}
                results={results}
                onToggle={toggleProcessor}
              />
            )}
          </div>

          <div className="p-3 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              LexLock RingGuard · Security Incident &amp; Evidence Management
            </p>
          </div>
        </aside>
      </main>
    </div>
  )
}
