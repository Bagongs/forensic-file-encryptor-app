import { contextBridge, ipcRenderer } from 'electron'

// ============================================================
// IPC DEBUG LOGGER
// ============================================================
// Aktif otomatis saat dev, dan bisa dipaksa aktif via ENV
const isDev = process.env.NODE_ENV === 'development'
const isDebug = process.env.IPC_DEBUG === '1' || isDev

function logIpc(direction, channel, payload) {
  if (!isDebug) return
  console.log(
    `%c[IPC ${direction}] %c${channel}`,
    'color:#9CDCFE;font-weight:bold;',
    'color:#CE9178;font-weight:bold;',
    payload
  )
}

// ============================================================
// API Wrapper + Logging
// ============================================================
const api = {
  // ---------- INVOKE ----------
  listSdp: async () => {
    logIpc('renderer → main (invoke)', 'list-sdp', null)
    const res = await ipcRenderer.invoke('list-sdp')
    logIpc('main → renderer (result)', 'list-sdp', res)
    return res
  },

  convertFile: async (fileObj) => {
    logIpc('renderer → main (invoke)', 'convert-file', {
      name: fileObj?.name,
      bufferBytes: fileObj?.buffer?.byteLength
    })
    const res = await ipcRenderer.invoke('convert-file', fileObj)
    logIpc('main → renderer (result)', 'convert-file', res)
    return res
  },

  downloadFile: async (filename) => {
    logIpc('renderer → main (invoke)', 'download-file', filename)
    const res = await ipcRenderer.invoke('download-file', filename)
    logIpc('main → renderer (result)', 'download-file', res)
    return res
  },

  // ---------- EVENT LISTENERS ----------
  onProgress: (callback) => {
    const handler = (_event, payload) => {
      logIpc('main → renderer (event)', 'convert-progress', payload)
      callback?.(payload)
    }
    ipcRenderer.on('convert-progress', handler)
    return () => ipcRenderer.removeListener('convert-progress', handler)
  },

  onComplete: (callback) => {
    const handler = (_event, payload) => {
      logIpc('main → renderer (event)', 'convert-complete', payload)
      callback?.(payload)
    }
    ipcRenderer.on('convert-complete', handler)
    return () => ipcRenderer.removeListener('convert-complete', handler)
  },
  quitApp: () => {
    logIpc('renderer → main (send)', 'quit-app', null)
    ipcRenderer.send('quit-app')
  }
}

contextBridge.exposeInMainWorld('fileEncryptor', Object.freeze(api))
