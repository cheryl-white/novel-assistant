import { Capacitor } from '@capacitor/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initNativeApp } from './lib/native'

async function bootstrap() {
  await initNativeApp()

  // PWA Service Worker 仅在浏览器使用；原生 App 不需要
  if (!Capacitor.isNativePlatform()) {
    const { registerSW } = await import('virtual:pwa-register')
    registerSW({ immediate: true })
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
