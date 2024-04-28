import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    service: {
      updateService: {
        handleSetTitle: (title: string) => void
      }
      openFileService: {
        handleFileOpen: () => Promise<string | undefined>
      }
    }
  }
}
