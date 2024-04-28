<script setup lang="ts">
import Versions from './components/Versions.vue'

const ipcHandle = () => window.electron.ipcRenderer.send('ping')

const { updateService, openFileService } = window.service

const setTitle = () => updateService.handleSetTitle('Hello Electron')

const openFile = async () => {
  const result = await openFileService.handleFileOpen()
  console.log('打开文件的路径: ', result)
}
</script>

<template>
  <img alt="logo" class="logo" src="./assets/electron.svg" />
  <div class="creator">Powered by electron-vite</div>
  <div class="text">
    Build an Electron app with
    <span class="vue">Vue</span>
    and
    <span class="ts">TypeScript</span>
  </div>
  <p class="tip">Please try pressing <code>F12</code> to open the devTool</p>
  <div class="actions">
    <div class="action">
      <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">Documentation</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="ipcHandle">Send IPC</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="setTitle">SetTitle</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="openFile">OpenFile</a>
    </div>
  </div>
  <Versions />
</template>
