/* eslint-disable no-control-regex */
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import axios from 'axios'
import FormData from 'form-data'
import { Readable } from 'stream'
import icon from '../../resources/icon.png?asset'

const API_BASE = process.env.API_BASE_URL || 'http://172.15.2.105:8000'
let mainWindow

const progressTimers = new Map()

// ============================================================
// IPC DEBUG LOGGER (MAIN)
// ============================================================
const isIpcDebug = process.env.IPC_DEBUG === '1' || is.dev
function ipcSend(channel, payload) {
  if (isIpcDebug) console.log(`[IPC → renderer] ${channel}`, payload)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Encryptor Analytics Platform',
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    fullscreen: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('encryptor-analytics-platform')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Probe reachability: coba /docs → /openapi.json → /
  const probeTargets = [`${API_BASE}/docs`, `${API_BASE}/openapi.json`, API_BASE]
  let probed = false
  for (const url of probeTargets) {
    try {
      const resp = await axios.get(url, { validateStatus: () => true })
      console.log('[probe] backend reachable:', { url, status: resp.status })
      probed = true
      break
    } catch (e) {
      console.warn('[probe] failed:', url, e?.code || e?.message)
    }
  }
  if (!probed) console.error('[probe] backend NOT reachable from main process (all targets failed)')

  createWindow()
})

app.on('before-quit', () => {
  for (const t of progressTimers.values()) clearInterval(t)
  progressTimers.clear()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

/* ---------------------------------------------------
   HELPERS
--------------------------------------------------- */
const toNodeBuffer = (b) => {
  if (!b) return null
  if (Buffer.isBuffer(b)) return b
  if (b instanceof ArrayBuffer) return Buffer.from(b)
  if (b?.data && Array.isArray(b.data)) return Buffer.from(b.data)
  if (b instanceof Uint8Array) return Buffer.from(b)
  return null
}

const guessMime = (name = '') => {
  const ext = path.extname(name).toLowerCase()
  if (ext === '.xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (ext === '.xls') return 'application/vnd.ms-excel'
  if (ext === '.csv') return 'text/csv'
  if (ext === '.txt') return 'text/plain'
  return 'application/octet-stream'
}

const toSdpName = (originalName = '') => {
  const base = path.parse(originalName).name
  return `${base}.sdp`
}

const sanitizeFilename = (filename = '') => {
  const base = path.basename(filename)
  return base.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
}

/* ---------------------------------------------------
   LIST SDP
--------------------------------------------------- */
ipcMain.handle('list-sdp', async () => {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/file-encryptor/list-sdp`, {
      validateStatus: (s) => s < 500
    })
    if (res.status >= 400) {
      const msg = res.data?.message || `HTTP ${res.status}`
      throw new Error(`list-sdp 4xx: ${msg}`)
    }
    return res.data?.data || []
  } catch (err) {
    console.error('[list-sdp] ERROR', {
      message: err?.message,
      code: err?.code,
      responseStatus: err?.response?.status,
      responseData: err?.response?.data
    })
    throw new Error(`list-sdp failed: ${err?.message || err}`)
  }
})

/* ---------------------------------------------------
   UPLOAD + START CONVERT
--------------------------------------------------- */
ipcMain.handle('convert-file', async (_, fileObj) => {
  const form = new FormData()

  try {
    const buf = toNodeBuffer(fileObj?.buffer)
    const filename = fileObj?.name || path.basename(fileObj?.path || 'upload.bin')
    const contentType = guessMime(filename)
    const convertedFilename = toSdpName(filename)

    if (buf) {
      form.append('file', Readable.from(buf), { filename, contentType })
    } else if (typeof fileObj?.path === 'string' && fileObj.path.length > 0) {
      form.append('file', fs.createReadStream(fileObj.path), { filename, contentType })
    } else {
      throw new Error('convert-file: missing file data (need buffer+name or a valid path string)')
    }

    const uploadRes = await axios.post(`${API_BASE}/api/v1/file-encryptor/convert-to-sdp`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: (s) => s < 500
    })

    if (uploadRes.status >= 400) {
      const backendMsg = uploadRes.data?.message || `HTTP ${uploadRes.status}`
      throw new Error(`backend 4xx: ${backendMsg}`)
    }

    // ✅ sesuai kontrak kamu: upload_id = string filename
    const uploadId = uploadRes.data?.data?.upload_id
    if (!uploadId) throw new Error('convert-file: backend did not return upload_id')

    // mulai polling progres (kirim juga nama frontend)
    pollProgress(uploadId, filename, convertedFilename)

    return { uploadId, convertedFilename }
  } catch (err) {
    console.error('[convert-file] ERROR', {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
      responseStatus: err?.response?.status,
      responseData: err?.response?.data
    })
    throw new Error(`convert-file failed: ${err?.message || err}`)
  }
})

/* ---------------------------------------------------
   POLLING PROGRESS (kontrak: /progress?upload_id=...)
--------------------------------------------------- */
function pollProgress(uploadId, originalFilename, convertedFilename) {
  // ✅ kontrak kamu pakai query param
  const url = `${API_BASE}/api/v1/file-encryptor/progress?upload_id=${encodeURIComponent(uploadId)}`

  if (progressTimers.has(uploadId)) {
    clearInterval(progressTimers.get(uploadId))
    progressTimers.delete(uploadId)
  }

  let errorStreak = 0
  const maxErrorStreak = 5

  const timer = setInterval(async () => {
    try {
      const res = await axios.get(url, { validateStatus: (s) => s < 500 })

      const data = res.data?.data || {}
      const status = data.status
      const progress = data.progress ?? 0

      errorStreak = 0

      ipcSend('convert-progress', {
        uploadId,
        originalFilename,
        convertedFilename,
        status,
        progress
      })

      // ✅ stop ketika terminal
      if (status === 'converted' || status === 'failed') {
        ipcSend('convert-complete', {
          uploadId,
          originalFilename,
          convertedFilename,
          status
        })
        clearInterval(timer)
        progressTimers.delete(uploadId)
      }
    } catch (err) {
      errorStreak += 1
      console.error('[pollProgress] ERROR', {
        uploadId,
        message: err?.message,
        code: err?.code,
        responseStatus: err?.response?.status,
        errorStreak
      })

      if (errorStreak >= maxErrorStreak) {
        clearInterval(timer)
        progressTimers.delete(uploadId)

        ipcSend('convert-progress', {
          uploadId,
          originalFilename,
          convertedFilename,
          status: 'failed',
          progress: 0
        })
        ipcSend('convert-complete', {
          uploadId,
          originalFilename,
          convertedFilename,
          status: 'failed'
        })
      }
    }
  }, 700)

  progressTimers.set(uploadId, timer)
}

/* ---------------------------------------------------
   DOWNLOAD FILE (save dialog)
--------------------------------------------------- */
ipcMain.handle('download-file', async (_, filename) => {
  try {
    const safeName = sanitizeFilename(filename)
    if (!safeName.toLowerCase().endsWith('.sdp')) {
      throw new Error('Only .sdp files can be downloaded')
    }

    const url = `${API_BASE}/api/v1/file-encryptor/download-sdp?filename=${encodeURIComponent(
      safeName
    )}`

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      validateStatus: (s) => s < 500
    })

    if (response.status === 404) {
      const msg = response.data?.message || `File not found: ${safeName}`
      throw new Error(msg)
    }
    if (response.status >= 400) {
      const msg = response.data?.message || `HTTP ${response.status}`
      throw new Error(msg)
    }

    const defaultPath = join(app.getPath('downloads'), safeName)
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save SDP File',
      defaultPath,
      filters: [{ name: 'SDP Files', extensions: ['sdp'] }]
    })

    if (canceled || !filePath) return { canceled: true }

    await fs.promises.writeFile(filePath, response.data)
    return { savePath: filePath, canceled: false }
  } catch (err) {
    console.error('[download-file] ERROR', {
      filename,
      message: err?.message,
      code: err?.code,
      responseStatus: err?.response?.status,
      responseData: err?.response?.data
    })
    throw new Error(`download-file failed: ${err?.message || err}`)
  }
})

ipcMain.on('quit-app', () => {
  console.log('[IPC] quit-app → closing application')
  app.quit()
})
