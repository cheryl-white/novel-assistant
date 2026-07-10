import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initNativeApp } from './lib/native'

async function bootstrap() {
  // 保留原生 App 初始化（如果有用的话）
  await initNativeApp()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
