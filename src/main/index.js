import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import axios from 'axios'
import FormData from 'form-data'
import { Readable } from 'stream'
import icon from '../../resources/icon.png?asset'

const API_BASE = 'http://172.15.2.191:8000'
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Probe reachability: coba /docs → /openapi.json → /
  const probeTargets = [`${API_BASE}/docs`, `${API_BASE}/openapi.json`, API_BASE]
  let probed = false
  for (const url of probeTargets) {
    try {
      const resp = await axios.get(url, { timeout: 2500, validateStatus: () => true })
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

/* ---------------------------------------------------
   LIST SDP (baru)
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
    // res.data.data = array of {original_filename, converted_filename, timestamp}
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

    if (buf) {
      form.append('file', Readable.from(buf), { filename, contentType })
    } else if (typeof fileObj?.path === 'string' && fileObj.path.length > 0) {
      form.append('file', fs.createReadStream(fileObj.path), { filename, contentType })
    } else {
      throw new Error('convert-file: missing file data (need buffer+name or a valid path string)')
    }

    console.log('[convert-file] prepared form, about to POST', {
      API_BASE,
      filename,
      contentType
    })

    const uploadRes = await axios.post(`${API_BASE}/api/v1/file-encryptor/convert-to-sdp`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: (s) => s < 500
    })

    console.log('[convert-file] POST done:', {
      status: uploadRes.status,
      dataKeys: Object.keys(uploadRes.data || {})
    })

    if (uploadRes.status >= 400) {
      const backendMsg = uploadRes.data?.message || `HTTP ${uploadRes.status}`
      throw new Error(`backend 4xx: ${backendMsg}`)
    }

    const uploadId = uploadRes.data?.data?.upload_id
    if (!uploadId) throw new Error('convert-file: backend did not return upload_id')

    // mulai polling progres
    pollProgress(uploadId, filename)
    return { uploadId }
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
   POLLING PROGRESS
--------------------------------------------------- */
async function pollProgress(uploadId, filename) {
  const url = `${API_BASE}/api/v1/file-encryptor/progress/${uploadId}`

  const timer = setInterval(async () => {
    try {
      const res = await axios.get(url, { validateStatus: (s) => s < 500 })
      const { status, progress } = res.data.data

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('convert-progress', {
          uploadId,
          filename,
          status,
          progress
        })
      }

      if (status === 'converted' || status === 'failed') clearInterval(timer)
    } catch (err) {
      console.error('[pollProgress] ERROR', {
        uploadId,
        message: err?.message,
        code: err?.code,
        responseStatus: err?.response?.status
      })
      clearInterval(timer)
    }
  }, 1500)
}

/* ---------------------------------------------------
   DOWNLOAD FILE (pakai nama .sdp persis)
--------------------------------------------------- */
ipcMain.handle('download-file', async (_, filename) => {
  try {
    const url = `${API_BASE}/api/v1/file-encryptor/download-sdp?filename=${encodeURIComponent(filename)}`
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      validateStatus: (s) => s < 500
    })

    if (response.status === 404) {
      const msg = response.data?.message || `File not found: ${filename}`
      throw new Error(msg)
    }
    if (response.status >= 400) {
      const msg = response.data?.message || `HTTP ${response.status}`
      throw new Error(msg)
    }

    const savePath = join(app.getPath('downloads'), filename)
    fs.writeFileSync(savePath, response.data)
    return { savePath }
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
