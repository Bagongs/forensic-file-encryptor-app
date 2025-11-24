import { useState, useEffect, useCallback } from 'react'
import HeaderBar from './components/HeaderBar'
import ConverterCard from './components/ConverterCard'
import DropZone from './components/DropZone'
import ConvertedList from './components/ConvertedList'

export default function App() {
  const [files, setFiles] = useState([])

  // ✅ hoisted helper
  function mergeByName(a, b) {
    const map = new Map()
    ;[...a, ...b].forEach((item) => {
      map.set(item.name, { ...map.get(item.name), ...item })
    })
    return Array.from(map.values())
  }

  const fetchList = useCallback(async () => {
    try {
      const list = await window.fileEncryptor.listSdp()
      const mapped = (list || []).map((it) => ({
        name: it.converted_filename,
        originalName: it.original_filename,
        status: 'done',
        uploadId: null,
        timestamp: it.timestamp,
        progress: 100
      }))
      setFiles((prev) => mergeByName(prev, mapped))
    } catch (e) {
      console.error('listSdp error:', e)
    }
  }, [])

  // 1) Fetch list-sdp saat mount
  useEffect(() => {
    fetchList()
  }, [fetchList])

  // 2) Update status saat ada progress
  useEffect(() => {
    const unsubProgress = window.fileEncryptor.onProgress(
      ({ uploadId, status, progress, convertedFilename }) => {
        setFiles((prev) =>
          prev.map((f) => {
            const matchById = uploadId && f.uploadId === uploadId
            const matchByName = convertedFilename && f.name === convertedFilename

            if (!matchById && !matchByName) return f

            return {
              ...f,
              status:
                status === 'converted' ? 'done' : status === 'failed' ? 'error' : 'converting',
              progress: typeof progress === 'number' ? progress : f.progress
            }
          })
        )
      }
    )

    const unsubComplete = window.fileEncryptor.onComplete(({ status }) => {
      if (status === 'converted') fetchList()
    })

    return () => {
      unsubProgress && unsubProgress()
      unsubComplete && unsubComplete()
    }
  }, [fetchList])

  // 3) Upload baru (convert)
  const handleFileSelect = async (file) => {
    if (!file) return
    const originalName = file.name
    const displayName = originalName.replace(/\.(xls|xlsx|csv|txt)$/i, '') + '.sdp'

    // placeholder converting
    setFiles((prev) =>
      mergeByName(prev, [
        {
          name: displayName,
          originalName,
          status: 'converting',
          uploadId: null,
          progress: 0
        }
      ])
    )

    try {
      const buffer = await file.arrayBuffer()
      const result = await window.fileEncryptor.convertFile({
        buffer,
        name: originalName
      })

      // update uploadId -> match by name (displayName)
      setFiles((prev) =>
        prev.map((f) =>
          f.name === (result.convertedFilename || displayName) && f.uploadId == null
            ? { ...f, uploadId: result.uploadId }
            : f
        )
      )
    } catch (e) {
      console.error('convertFile error:', e)
      alert(`Gagal upload/convert:\n${e?.message || e}`)
      setFiles((prev) =>
        prev.map((f) => (f.name === displayName ? { ...f, status: 'error', progress: 0 } : f))
      )
    }
  }

  // 4) Download file .sdp (save dialog)
  const handleDownload = async (file) => {
    try {
      if (!file?.name?.toLowerCase().endsWith('.sdp')) {
        alert('Hanya file .sdp yang bisa di-download.')
        return
      }
      if (file.status !== 'done') {
        alert('File belum selesai dikonversi.')
        return
      }

      const result = await window.fileEncryptor.downloadFile(file.name)
      if (result?.canceled) return

      alert(`File saved to:\n${result.savePath}`)
    } catch (e) {
      console.error('downloadFile error:', e)
      alert(`Gagal download:\n${e?.message || e}`)
    }
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-cover bg-center">
      <div className="app-header">
        <HeaderBar />
      </div>

      <h1 className="converter-title ml-[51px] mt-[46px] mb-8 text-white">Converter</h1>

      <div className="flex justify-center">
        <ConverterCard>
          <h1 className="text-center text-xl font-semibold mb-1">SDP Converter</h1>
          <p className="text-center text-gray-400 mb-8">
            Please upload your data file (XLS, CSV, or TXT) to convert into SDP format.
          </p>

          <DropZone onFileSelect={handleFileSelect} />
          {/* files berisi status + progress, ConvertedList bisa pakai progress bar */}
          <ConvertedList files={files} onDownload={handleDownload} />
        </ConverterCard>
      </div>
    </div>
  )
}
