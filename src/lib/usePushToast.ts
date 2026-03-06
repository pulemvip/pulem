'use client'

// /lib/usePushToast.ts
// Escucha mensajes del Service Worker y muestra un toast en la app

import { useEffect, useState } from 'react'

type PushToast = {
  id: number
  title: string
  body: string
  url: string
}

export function usePushToast() {
  const [toasts, setToasts] = useState<PushToast[]>([])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const handler = (event: MessageEvent) => {
      if (event.data?.type !== 'PUSH_RECEIVED') return

      const toast: PushToast = {
        id: Date.now(),
        title: event.data.title,
        body: event.data.body,
        url: event.data.url,
      }

      setToasts(prev => [...prev, toast])

      // Auto-remover después de 6 segundos
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 6000)
    }

    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [])

  const dismiss = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, dismiss }
}
