import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('fileEncryptor', {
  listSdp: () => ipcRenderer.invoke('list-sdp'),
  convertFile: (fileObj) => ipcRenderer.invoke('convert-file', fileObj),
  downloadFile: (filename) => ipcRenderer.invoke('download-file', filename),
  onProgress: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('convert-progress', handler)
    return () => ipcRenderer.removeListener('convert-progress', handler)
  }
})
