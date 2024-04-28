import { ipcMain, ipcRenderer } from 'electron'
import services from './services'
import { ChannelWay, getMetadata } from './shared/reflect'

export function initMainBridge(): void {
  services &&
    services.forEach((service) => {
      const { service: name, handle, way } = getMetadata(service.name)
      if (way === ChannelWay.RENDERER_TO_MAIN__ONE_WAY) {
        // arg1: channel
        // arg2: listener
        ipcMain.on(`${name}:${handle.name}`, handle)
      } else if (way === ChannelWay.RENDERER_TO_MAIN__TWO_WAY) {
        // arg1: channel
        // arg2: listener
        ipcMain.handle(`${name}:${handle.name}`, handle)
      }
    })
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function initPreloadBridge(): { [key: string]: Function } {
  const api = {}
  services &&
    services.forEach((service) => {
      const { service: name, handle, way } = getMetadata(service.name)
      Reflect.set(api, `${name}`, {})
      if (way === ChannelWay.RENDERER_TO_MAIN__ONE_WAY) {
        Reflect.set(api[name], `${handle.name}`, (...args) => {
          ipcRenderer.send(`${name}:${handle.name}`, ...args)
        })
      } else if (way === ChannelWay.RENDERER_TO_MAIN__TWO_WAY) {
        Reflect.set(api[name], `${handle.name}`, (...args) => {
          ipcRenderer.invoke(`${name}:${handle.name}`, ...args)
        })
      }
    })
  return api
}
