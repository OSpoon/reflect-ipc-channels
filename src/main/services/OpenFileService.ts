import { ServiceHandler, ServiceRegister } from '../shared/reflect'
import { dialog } from 'electron/main'

@ServiceRegister('openFileService')
export default class OpenFileService {
  @ServiceHandler()
  async handleFileOpen() {
    const { canceled, filePaths } = await dialog.showOpenDialog({})
    if (!canceled) {
      return filePaths[0]
    }
    return undefined
  }
}
