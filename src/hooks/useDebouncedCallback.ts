import { useCallback, useEffect, useRef } from 'react'

type DebouncedFn<T extends (...args: never[]) => void> = T & {
  flush: () => void
  cancel: () => void
}

/**
 * 防抖回调；支持 flush（刷新/切页前立刻落盘，避免丢字）
 */
export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
): DebouncedFn<T> {
  const callbackRef = useRef(callback)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const argsRef = useRef<Parameters<T> | null>(null)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const flush = useCallback(() => {
    if (!argsRef.current) {
      cancel()
      return
    }
    const args = argsRef.current
    argsRef.current = null
    cancel()
    callbackRef.current(...args)
  }, [cancel])

  useEffect(() => {
    const persistPending = () => flush()
    window.addEventListener('beforeunload', persistPending)
    window.addEventListener('pagehide', persistPending)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') persistPending()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('beforeunload', persistPending)
      window.removeEventListener('pagehide', persistPending)
      document.removeEventListener('visibilitychange', onVisibility)
      flush()
    }
  }, [flush])

  const run = useCallback(
    ((...args: Parameters<T>) => {
      argsRef.current = args
      cancel()
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        const pending = argsRef.current
        argsRef.current = null
        if (pending) callbackRef.current(...pending)
      }, delay)
    }) as T,
    [cancel, delay],
  )

  return Object.assign(run, { flush, cancel }) as DebouncedFn<T>
}
