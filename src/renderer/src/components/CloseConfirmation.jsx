/* eslint-disable react/prop-types */
import clsx from 'clsx'
import { useId, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function CloseConfirmationModal({ open, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const titleId = useId()

  // ESC key
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onCancel?.()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 font-[Aldrich]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={clsx('relative shadow-xl w-[520px] overflow-hidden')}
        style={{ background: '#0D1521' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: '#2A3A51',
            borderBottom: '2px solid #EDC702'
          }}
        >
          <h2 id={titleId} className="app-title text-[18px] text-white">
            Close Confirmation
          </h2>

          <button
            onClick={onCancel}
            aria-label="Close"
            className="text-white/80 hover:text-white text-[20px] leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col items-center text-center text-white">
          {/* Warning Icon */}
          <div className="mb-6">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 1 22h22L12 2Z" stroke="#EDC702" strokeWidth="2" fill="none" />
              <path d="M12 9v5" stroke="#EDC702" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16.5" r="1" fill="#EDC702" />
            </svg>
          </div>

          {/* Title Text */}
          <p className="text-[20px] font-medium mb-5">Are you sure want to close app?</p>

          {/* Buttons */}
          {/* Buttons */}
          <div className="flex gap-6 mt-4">
            {/* CANCEL */}
            <button
              onClick={onCancel}
              className="w-36 h-10 text-sm rounded-sm border border-[#C3CFE0] text-white  cursor-pointer"
            >
              CANCEL
            </button>

            {/* YES */}
            <button
              onClick={onConfirm}
              className="w-36 h-10 text-sm rounded-sm border border-[#C3CFE0] text-white cursor-pointer  bg-[#2A3A51]"
            >
              YES
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
