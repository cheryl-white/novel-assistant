import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

/** 初始化安卓 / iOS 原生能力（浏览器环境自动跳过） */
export async function initNativeApp(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  document.documentElement.classList.add('native-app')
  document.documentElement.dataset.platform = Capacitor.getPlatform()

  try {
    await StatusBar.setStyle({ style: Style.Light })
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#faf8f5' })
    }
  } catch {
    // 部分模拟器可能不支持
  }

  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body })
  } catch {
    // ignore
  }

  void CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      void CapApp.exitApp()
    }
  })

  try {
    await SplashScreen.hide()
  } catch {
    // ignore
  }
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}
