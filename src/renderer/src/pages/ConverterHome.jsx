import { useState, useEffect, useCallback } from 'react'
import ConverterCard from '../components/ConverterCard'
import DropZone from '../components/DropZone'
import ConvertedList from '../components/ConvertedList'

export default function ConverterHome() {
  const [files, setFiles] = useState([])

  function mergeByName(a, b) {
    const map = new Map()
    ;[...a, ...b].forEach((item) => {
      map.set(item.name, { ...map.get(item.name), ...item })
    })
    return Array.from(map.values())
  }

  function sortFiles(files) {
    return [...files].sort((a, b) => {
      const ta = new Date(a.timestamp || 0).getTime()
      const tb = new Date(b.timestamp || 0).getTime()
      return tb - ta
    })
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

      setFiles((prev) => sortFiles(mergeByName(prev, mapped)))
    } catch (e) {
      console.error('listSdp error:', e)
    }
  }, [])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    const unsubProgress = window.fileEncryptor.onProgress(
      ({ uploadId, convertedFilename, status, progress }) => {
        setFiles((prev) =>
          sortFiles(
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

  const handleFileSelect = async (file) => {
    if (!file) return

    const originalName = file.name
    const displayName = originalName.replace(/\.(xls|xlsx|csv|txt)$/i, '') + '.sdp'

    setFiles((prev) =>
      sortFiles(
        mergeByName(prev, [
          {
            name: displayName,
            originalName,
            status: 'converting',
            uploadId: null,
            progress: 0,
            timestamp: Date.now()
          }
        ])
      )
    )

    try {
      const buffer = await file.arrayBuffer()
      const result = await window.fileEncryptor.convertFile({
        buffer,
        name: originalName
      })

      setFiles((prev) =>
        sortFiles(
          prev.map((f) =>
            f.name === (result.convertedFilename || displayName) && f.uploadId == null
              ? { ...f, uploadId: result.uploadId }
              : f
          )
        )
      )
    } catch (e) {
      console.error('convertFile error:', e)
      alert(`Gagal upload/convert:\n${e?.message || e}`)

      setFiles((prev) =>
        sortFiles(
          prev.map((f) => (f.name === displayName ? { ...f, status: 'error', progress: 0 } : f))
        )
      )
    }
  }

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
    <>
      {/* TITLE */}
      <div className="w-full px-[51px] pt-[46px]">
        <h1 className="text-white text-2xl tracking-wide font-semibold">CONVERTER</h1>
      </div>

      {/* CARD AREA */}
      <main className="flex-1 w-full flex items-center justify-center pt-10">
        <ConverterCard>
          <h1 className="text-center text-xl font-semibold mb-1">SDP Converter</h1>
          <p className="text-center text-gray-400 mb-8">
            Please upload your data file (XLS, CSV, or TXT) to convert into SDP format.
          </p>

          <DropZone onFileSelect={handleFileSelect} />
          <ConvertedList files={files} onDownload={handleDownload} />
        </ConverterCard>
      </main>
    </>
  )
}
