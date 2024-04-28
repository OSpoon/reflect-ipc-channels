# Electron 进程通信（IPC）装饰器应用
在 **Electron** 在实现渲染进程到主进程通信时，无论是单向通信还是双向通信都必须经过：编写处理函数（主进程）、注册事件监听（主进程）、暴露 **API**（预加载脚本）和执行 **API**（渲染进程）4 个步骤。其中除了编写处理函数和执行 **API** 两个与业务代码紧相关的步骤外，注册事件监听和暴露 **API** 均具有共性且需要重复编码的特点，这一特点又恰巧符合 **AOP** 切面编程中反射技术的应用场景，所以我选择使用 **TypeScript** 装饰器来实现这部分代码的优化。
## IPC 通信 API
渲染进程到主进程通信涉及到的 **API** 如下：

| 渲染进程到主进程 | 发送 | 接收 |
| --- | --- | --- |
| 单向 | ipcRenderer.send | ipcMain.on |
| 双向 | ipcRenderer.invoke | ipcMain.handle |

在终端执行下面的命令创建一个新的 **Electron** + **Vite** 项目：
```bash
npm create @quick-start/electron@latest

# 选择 TypeScript
✔ Project name: … reflect-ipc-channels
✔ Select a framework: › vue
✔ Add TypeScript? … No / Yes
✔ Add Electron updater plugin? … No / Yes
✔ Enable Electron download mirror proxy? … No / Yes
```
### 设置标题-单向通信：
Electron 官方单向通信示例文档：[Inter-Process Communication | Electron](https://www.electronjs.org/docs/latest/tutorial/ipc#pattern-1-renderer-to-main-one-way)
#### 编写处理函数：
新建 `src/main/business.ts` 文件，编写设置标题的处理函数：
```typescript
import { BrowserWindow } from 'electron/main'

export function handleSetTitle(event, title) {
  const webContents = event.sender
  const win = BrowserWindow.fromWebContents(webContents)
  win.setTitle(title)
}
```
#### 注册事件监听：
在 `src/main/index.ts` 中当 `app.whenReady` 后，调用 `ipcMain.on` 注册处理函数的事件监听：
```typescript
app.whenReady().then(() => {
  ipcMain.on('set-title', handleSetTitle)
})
```
#### 暴露 API：
在 `src/preload/index.ts` 中调用 `exposeInMainWorld` 暴露 **API** 到渲染进程：
```typescript
contextBridge.exposeInMainWorld('service', {
  setTitle: (title) => ipcRenderer.send('set-title', title)
})
```
#### 执行 API：
当 **API** 被暴露后就可以在渲染进程中通过 `window.service` 就获取到需要执行的 **API**：
```vue
<script setup lang="ts">
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setTitle = () => (window as any).service?.setTitle('Hello Electron')
</script>

<template>
  <div class="actions">
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="setTitle">SetTitle</a>
    </div>
  </div>
</template>
```
### 获取文件-双向通信：
Electron 官方双向通信示例文档：[Inter-Process Communication | Electron](https://www.electronjs.org/docs/latest/tutorial/ipc#pattern-2-renderer-to-main-two-way)
#### 编写处理函数：
更新 `src/main/business.ts` 文件，新增 `handleFileOpen` 处理函数：
```typescript
import { BrowserWindow, dialog } from 'electron/main'

export async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({})
  if (!canceled) {
    return filePaths[0]
  }
}
```
#### 注册事件监听：
调用 `ipcMain.on` 注册处理函数的事件监听：
```typescript
app.whenReady().then(() => {
  ipcMain.handle('dialog:openFile', handleFileOpen)
})
```
#### 暴露 API：
在 `src/preload/index.ts` 中暴露 **API** 到渲染进程：
```typescript
contextBridge.exposeInMainWorld('service', {
  openFile: () => ipcRenderer.invoke('dialog:openFile')
})
```
#### 执行 API：
执行 API 并接收返回的文件路径：
```vue
<script setup lang="ts">
const openFile = async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (window as any).service?.openFile()
  console.log('打开文件的路径: ', result)
}
</script>

<template>
  <div class="actions">
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="openFile">OpenFile</a>
    </div>
  </div>
</template>
```
## 元数据反射 API
在终端执行下面的命令创建一个新的 TypeScript 项目：
```bash
# 全局安装命令行工具箱
npm i -g command-line-toolbox

# 执行 create 命令
$ clt create
? project template ospoon/pkg-template-ts
? project name: reflect-metadata-demo
? project description:  Typescript 装饰器应用
✔ init project template successful
```
安装 `reflect-metadata` 到项目此：
```bash
npm i reflect-metadata
```
在 `tsconfig.json` 中启用 `experimentalDecorators` 和 `emitDecoratorMetadata` 两个选项：
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```
调整目录结构：
```
reflect-metadata-demo      
├─ src                     
│  ├─ services             
│  │  ├─ UpdateService.ts  		 * 业务服务代码
│  │  └─ index.ts          		 * 聚合业务服务
│  ├─ shared               
│  │  └─ reflect.ts        		 * 定义装饰器
│  └─ index.ts      
```
### 约定业务服务规范：
使用 `@ServiceRegister` 装饰器描述服务类并设置服务名称，再使用 `@ServiceHandler` 装饰器描述一个业务处理函数：
```typescript
// src/services/UpdateService.ts
import { log } from 'node:console'
import { ServiceHandler, ServiceRegister } from '../shared/reflect'

@ServiceRegister('updateService')
export default class UpdateService {
  @ServiceHandler()
  setTitle(title: string): void {
    log(title)
  }
}

// src/services/index.ts
import UpdateService from './UpdateService'

export default [
  UpdateService,
]
```
### 定义类、函数装饰器：
```typescript
// src/shared/reflect.ts
import { log } from 'node:console'

export function ServiceRegister(serviceName: string) {
  return (target: any) => {
    log('serviceName', serviceName)
    log('target', target)
  }
}

export function ServiceHandler() {
  return (target: any, _: string, descriptor: PropertyDescriptor) => {
    log('target', target)
    log('descriptor', descriptor)
  }
}
```
### 收集装饰器元数据：
上面定义的装饰器还没有任何的作用，现在需要借助 `reflect-metadata` 模块进行简单的配置，用来使装饰器真正生效：
```typescript
import 'reflect-metadata'

// 定义一个 metadata 用来收集所有的元数据
const _metadata = {}

export function ServiceRegister(serviceName: string) {
  return (target: any) => {
    const targetName = target.name
    // 合并元数据
    const data = {
      service: serviceName, // 服务名称
      ...Reflect.getMetadata(`${targetName}`, _metadata),
    }
    // 更新元数据
    Reflect.defineMetadata(`${targetName}`, data, _metadata)
  }
}

export function ServiceHandler() {
  return (target: any, _: string, descriptor: PropertyDescriptor) => {
    const targetName = target.constructor.name
    // 合并元数据
    const data = {
      handle: descriptor.value, // 处理函数
      ...Reflect.getMetadata(`${targetName}`, _metadata),
    }
    // 更新元数据
    Reflect.defineMetadata(`${targetName}`, data, _metadata)
  }
}
```
提供根据类名称获取当前类装饰器的元数据：
```typescript
export const getMetadata = (className: string) => Reflect.getMetadata(`${className}`, _metadata)
```
### 单元测试：
在 `index.ts` 编写提取装饰器元数据的入口函数：
```typescript
import services from './services'
import { getMetadata } from './shared/reflect'

export function setup() {
  return getMetadata(services[0].name)
}
```
更新测试用例：
```typescript
import { describe, expect, it } from 'vitest'
import { setup } from '../src'

describe('should', () => {
  it('exported', () => {
    const result = setup()
    expect(result).toMatchInlineSnapshot(`
      {
        "handle": [Function],
        "service": "updateService",
      }
    `)
  })
})
```
## 自动注册业务机制
切换到 **Electron** + **Vite **项目，移植 **TypeScript** 项目中的依赖、配置及关键代码（已标 *****），接下来完成与 **Electron IPC** 通信 **API** 的对接实现自动注册业务机制：
### 定义业务服务：
将原 `business.ts` 文件中的业务处理函数，修改为约定业务服务规范，在 `@ServiceHandler` 装饰器定义时增加一个区分单向或双向通信的标识。
```typescript
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
```
```typescript
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
```
PS：编写的业务服务一定要在 `src/main/services/index.ts` 中导出；
### 定义 Bridge 函数：
新增 `src/main/bridge.ts` 文件，定义下面的两个函数：

1. `initMainBridge`: 自动注册事件监听（主进程）
```typescript
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
```

2. `initPreloadBridge`: 自动暴露API（预加载脚本）
```typescript
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
          return ipcRenderer.invoke(`${name}:${handle.name}`, ...args)
        })
      }
    })
  return api
}
```

3. 在 `app.whenReady` 执行 `initMainBridge`，并更新 `apiKey` 为 `service` 的 `exposeInMainWorld` 函数：
```typescript
// src/main/index.ts
app.whenReady().then(() => {
  initMainBridge()
})

// src/preload/index.ts
contextBridge.exposeInMainWorld('service', initPreloadBridge())
```
### 编写类型定义：
在 `src/preload/index.d.ts` 更新关于 `service` 的类型定义；
```typescript
declare global {
  interface Window {
    service: {
      updateService: {
        updateService: (title: string) => void
      }
      openFileService: {
        handleFileOpen: () => Promise<string | undefined>
      }
    }
  }
}
```
### 渲染进程执行 API：
```typescript
const ipcHandle = () => window.electron.ipcRenderer.send('ping')

const { updateService, openFileService } = window.service

const setTitle = () => updateService.handleSetTitle('Hello Electron')
const openFile = async () => {
  const result = openFileService.handleFileOpen()
  console.log('打开文件的路径: ', result)
}
```
## 总结
通过对 **Electron** 进程通信代码利用 **TypeScript** 装饰器进行封装，实现注册事件监听和暴露 **API** 的操作自动化，在遇到新的进程通信功能时仅需要按约定实现业务部分的核心服务后即可在渲染进程中直接执行 API。

PS：源码访问 [reflect-ipc-channels](https://github.com/OSpoon/reflect-ipc-channels) 获取；
