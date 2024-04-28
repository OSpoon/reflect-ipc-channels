import { ChannelWay, ServiceHandler, ServiceRegister } from '../shared/reflect'
import { BrowserWindow } from 'electron/main'
import type { IpcMainEvent } from 'electron/main'

@ServiceRegister('updateService')
export default class UpdateService {
  @ServiceHandler(ChannelWay.RENDERER_TO_MAIN__ONE_WAY)
  handleSetTitle(event: IpcMainEvent, title: string): void {
    const webContents = event.sender
    const win = BrowserWindow.fromWebContents(webContents)
    win?.setTitle(title)
  }
}
