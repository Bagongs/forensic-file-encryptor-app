import { contextBridge, ipcRenderer } from 'electron'

const api = {
  listSdp: () => ipcRenderer.invoke('list-sdp'),
  convertFile: (fileObj) => ipcRenderer.invoke('convert-file', fileObj),
  downloadFile: (filename) => ipcRenderer.invoke('download-file', filename),

  onProgress: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('convert-progress', handler)
    return () => ipcRenderer.removeListener('convert-progress', handler)
  },

  onComplete: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('convert-complete', handler)
    return () => ipcRenderer.removeListener('convert-complete', handler)
  }
}

contextBridge.exposeInMainWorld('fileEncryptor', Object.freeze(api))
