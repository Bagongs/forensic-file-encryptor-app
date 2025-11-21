import { useState, useEffect } from 'react'
import HeaderBar from './components/HeaderBar'
import ConverterCard from './components/ConverterCard'
import DropZone from './components/DropZone'
import ConvertedList from './components/ConvertedList'

export default function App() {
  const [files, setFiles] = useState([])

  // 1) Fetch list-sdp saat mount
  useEffect(() => {
    ;(async () => {
      try {
        const list = await window.fileEncryptor.listSdp()
        // list = [{ original_filename, converted_filename, timestamp }]
        // Normalisasi ke shape yang dipakai UI
        const mapped = (list || []).map((it) => ({
          name: it.converted_filename, // penting: ini yang dipakai download
          originalName: it.original_filename,
          status: 'done',
          uploadId: null,
          timestamp: it.timestamp
        }))
        setFiles((prev) => mergeByName(prev, mapped))
      } catch (e) {
        console.error('listSdp error:', e)
      }
    })()
  }, [])

  // 2) Update status saat ada progress
  useEffect(() => {
    const unsubscribe = window.fileEncryptor.onProgress(({ uploadId, status }) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.uploadId === uploadId
            ? {
                ...f,
                status:
                  status === 'converted' ? 'done' : status === 'failed' ? 'error' : 'converting'
              }
            : f
        )
      )
    })
    return unsubscribe
  }, [])

  // Helper: gabung list tanpa duplikasi by name
  const mergeByName = (a, b) => {
    const map = new Map()
    ;[...a, ...b].forEach((item) => {
      map.set(item.name, { ...map.get(item.name), ...item })
    })
    return Array.from(map.values())
  }

  // 3) Upload baru (convert)
  const handleFileSelect = async (file) => {
    if (!file) return
    const originalName = file.name
    const displayName = originalName.replace(/\.(xls|xlsx|csv|txt)$/i, '') + '.sdp'

    // Tambahkan placeholder converting
    setFiles((prev) =>
      mergeByName(prev, [{ name: displayName, originalName, status: 'converting', uploadId: null }])
    )

    try {
      console.log('[renderer] calling convertFile with', { name: originalName, size: file.size })
      const buffer = await file.arrayBuffer()
      const result = await window.fileEncryptor.convertFile({ buffer, name: originalName })

      // simpan uploadId ke item yang sama (name = displayName)
      setFiles((prev) =>
        prev.map((f) =>
          f.name === displayName && f.uploadId === null ? { ...f, uploadId: result.uploadId } : f
        )
      )
    } catch (e) {
      console.error('convertFile error:', e)
      alert(`Gagal upload/convert:\n${e?.message || e}`)
      setFiles((prev) => prev.map((f) => (f.name === displayName ? { ...f, status: 'error' } : f)))
    }
  }

  // 4) Download file .sdp (harus pakai name persis dari list-sdp)
  const handleDownload = async (file) => {
    try {
      if (!file?.name?.toLowerCase().endsWith('.sdp')) {
        alert('Hanya file .sdp yang bisa di-download. Pilih item dengan status selesai.')
        return
      }
      const result = await window.fileEncryptor.downloadFile(file.name)
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
          {/* ConvertedList harus menampilkan files dan tombol Download */}
          <ConvertedList files={files} onDownload={handleDownload} />
        </ConverterCard>
      </div>
    </div>
  )
}
