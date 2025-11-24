/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react'
import downloadIcon from '../assets/icons/download.svg'
import fileIcon from '../assets/icons/file.svg'

export default function ConvertedList({ files = [], onDownload }) {
  // Empty state
  if (!files || files.length === 0) {
    return (
      <div className="sdp-list-panel scroll-thin rounded-xl border border-white/10 bg-[#0B111A]/70 backdrop-blur p-6 text-center text-white/60">
        Belum ada file yang dikonversi.
      </div>
    )
  }

  // ===== NEW badge state =====
  const [showNew, setShowNew] = useState(true)
  const timerRef = useRef(null)

  // id unik untuk file terbaru (biar kalau file terbaru berubah, NEW muncul lagi)
  const latestId = useMemo(() => {
    const f0 = files[0]
    if (!f0) return null
    // gabung name + timestamp agar unik per versi file
    return `${f0.name || ''}|${f0.timestamp || ''}`
  }, [files])

  // setiap kali latestId berubah → tampilkan NEW lagi dan auto-hide 3 detik
  useEffect(() => {
    setShowNew(true)
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      setShowNew(false)
    }, 3000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [latestId])

  return (
    <div className="sdp-list-panel scroll-thin">
      <ul className="divide-y divide-white/10">
        {files.map((file, idx) => {
          const isDone = file.status === 'done'
          const isConverting = file.status === 'converting'
          const isError = file.status === 'error'

          // Item pertama = terbaru
          const isLatest = idx === 0
          const shouldShowNew = isLatest && showNew

          return (
            <li
              key={`${file.name}-${idx}`}
              className="sdp-row relative flex items-center justify-between gap-4 py-3 px-4 hover:bg-white/5 transition rounded-md"
              style={{ minHeight: 'var(--sdp-row-h, 64px)' }}
              // ✅ NEW hilang saat hover item terbaru
              onMouseEnter={() => {
                if (isLatest && showNew) setShowNew(false)
              }}
            >
              {/* NEW BADGE */}
              {shouldShowNew && (
                <div className="absolute -top-2 left-4 px-2 py-0.5 text-xs font-semibold rounded bg-[#EDC702]/90 text-black shadow-md">
                  NEW
                </div>
              )}

              {/* FILE INFO */}
              <div className="flex items-center gap-3 min-w-0 flex-1 mt-1">
                <img src={fileIcon} alt="" className="w-[42px] h-[42px] shrink-0" />
                <div className="min-w-0">
                  <div className="truncate text-[16px] sm:text-[18px] leading-[140%] font-medium text-white">
                    {file.name}
                  </div>
                </div>
              </div>

              {/* STATUS + ACTION */}
              <div className="flex items-center gap-4 shrink-0">
                <div
                  className="status-badge"
                  style={{
                    background: isDone ? '#2C3C53' : isError ? 'rgba(220,38,38,.35)' : '#737B86'
                  }}
                >
                  {isConverting && <span className="status-loading">Converting...</span>}
                  {isDone && <span className="status-text">Converted</span>}
                  {isError && <span className="status-text">Error</span>}
                  {!isConverting && !isDone && !isError && (
                    <span className="status-text">Unknown</span>
                  )}
                </div>

                {isDone && (
                  <button
                    onClick={() => onDownload && onDownload(file)}
                    className="hover:opacity-80 transition"
                    aria-label={`Download ${file.name}`}
                    title={`Download ${file.name}`}
                  >
                    <img src={downloadIcon} alt="" className="w-6 h-6" />
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
