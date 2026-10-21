
'use client'

interface HeaderProps {
  connected: boolean
  enabledCount: number
  simpleMode?: boolean
}

export function Header({
  connected,
  enabledCount,
  simpleMode,
}: HeaderProps) {
  return (
    <header className="bg-dash-panel border-b border-slate-700 px-5 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
          <span className="text-2xl" role="img" aria-label="Security">
            🛡️
          </span>
        </div>

        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            LexLock <span className="text-cyan-400">RingGuard</span>
          </h1>
          <p className="text-xs text-slate-400">
            Security Incident & Evidence Management
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!simpleMode && (
          <>
            <span
              className={`text-xs px-3 py-1.5 rounded-full border ${
                connected
                  ? 'bg-green-900/40 text-green-300 border-green-800'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {connected ? '● Events Connected' : '○ Events Disconnected'}
            </span>

            {enabledCount > 0 && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-800">
                {enabledCount} processor{enabledCount !== 1 ? 's' : ''} active
              </span>
            )}
          </>
        )}

        <span className="hidden sm:inline-flex text-xs px-3 py-1.5 rounded-full bg-cyan-950/50 text-cyan-300 border border-cyan-900">
          Ring Playground
        </span>
      </div>
    </header>
  )
}
