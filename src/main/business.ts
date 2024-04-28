import { BrowserWindow, dialog } from 'electron/main'

export function handleSetTitle(event, title) {
  const webContents = event.sender
  const win = BrowserWindow.fromWebContents(webContents)
  win.setTitle(title)
}

export async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({})
  if (!canceled) {
    return filePaths[0]
  }
}
