/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react'
import downloadIcon from '../assets/icons/download.svg'
import fileIcon from '../assets/icons/file.svg'

export default function ConvertedList({ files = [], onDownload }) {
  // =========================
  // HOOKS HARUS DI ATAS
  // =========================
  const newestKey = useMemo(() => {
    if (!files || files.length === 0) return null
    // files sudah kamu sort newest-first di ConverterHome
    const newest = files[0]
    return newest?.uploadId || newest?.name || null
  }, [files])

  const [showNewFor, setShowNewFor] = useState(null)
  const timerRef = useRef(null)

  // ketika newest berubah → tampilkan NEW 3 detik
  useEffect(() => {
    if (!newestKey) return

    setShowNewFor(newestKey)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setShowNewFor((cur) => (cur === newestKey ? null : cur))
    }, 3000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [newestKey])

  // =========================
  // EMPTY STATE SETELAH HOOK
  // =========================
  if (!files || files.length === 0) {
    return (
      <div className="sdp-list-panel scroll-thin rounded-xl border border-white/10 bg-[#0B111A]/70 backdrop-blur p-6 text-center text-white/60">
        Belum ada file yang dikonversi.
      </div>
    )
  }

  return (
    <div className="sdp-list-panel scroll-thin">
      <ul className="divide-y divide-white/10">
        {files.map((file) => {
          const isDone = file.status === 'done'
          const isConverting = file.status === 'converting'
          const isError = file.status === 'error'

          const key = file.uploadId || file.name
          const isNewest = showNewFor && key === showNewFor

          return (
            <li
              key={key}
              className="flex items-center justify-between gap-3 py-3 px-2 hover:bg-white/5 rounded-lg transition"
              onMouseEnter={() => {
                // NEW hilang kalau di-hover
                if (isNewest) setShowNewFor(null)
              }}
            >
              {/* LEFT: icon + names */}
              <div className="flex items-center gap-3 min-w-0">
                <img src={fileIcon} alt="" className="w-6 h-6 opacity-80" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-white font-medium">{file.name}</p>

                    {isNewest && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-300/30">
                        NEW
                      </span>
                    )}
                  </div>

                  <p className="truncate text-white/50 text-xs">{file.originalName || '-'}</p>

                  {isConverting && (
                    <div className="mt-2 w-[220px] h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400/80 transition-all"
                        style={{ width: `${file.progress || 0}%` }}
                      />
                    </div>
                  )}

                  {isError && <p className="mt-1 text-xs text-red-400">Gagal dikonversi</p>}
                </div>
              </div>

              {/* RIGHT: action */}
              <button
                disabled={!isDone}
                onClick={() => isDone && onDownload?.(file)}
                className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-md border border-white/10
                  ${isDone ? 'hover:bg-white/10 text-white' : 'opacity-40 cursor-not-allowed text-white/60'}`}
              >
                <img src={downloadIcon} alt="" className="w-4 h-4" />
                <span className="text-xs">Download</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
