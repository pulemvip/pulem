'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('[Push] Notifications no soportadas')
      return
    }

    console.log('[Push] Permission actual:', Notification.permission)
    setPermission(Notification.permission)

    if (Notification.permission === 'granted') {
      checkExistingSubscription()
    }
  }, [])

  const checkExistingSubscription = async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('[Push] Service Worker no soportado')
      return
    }
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      console.log('[Push] Suscripción existente:', sub ? 'SÍ' : 'NO')
      setSubscribed(!!sub)
    } catch (err) {
      console.error('[Push] Error checkExistingSubscription:', err)
    }
  }

  const subscribe = async () => {
    console.log('[Push] Iniciando subscribe...')

    if (!('serviceWorker' in navigator)) {
      console.error('[Push] Service Worker no disponible')
      alert('Tu navegador no soporta notificaciones push')
      return
    }

    if (!('PushManager' in window)) {
      console.error('[Push] PushManager no disponible')
      alert('Tu navegador no soporta notificaciones push')
      return
    }

    setLoading(true)

    try {
      // 1. Registrar SW
      console.log('[Push] Registrando SW...')
      const reg = await navigator.serviceWorker.register('/sw.js')
      console.log('[Push] SW registrado:', reg.scope)

      await navigator.serviceWorker.ready
      console.log('[Push] SW listo')

      // 2. Pedir permiso
      console.log('[Push] Pidiendo permiso...')
      const perm = await Notification.requestPermission()
      console.log('[Push] Permiso resultado:', perm)
      setPermission(perm)

      if (perm !== 'granted') {
        console.log('[Push] Permiso denegado, abortando')
        setLoading(false)
        return
      }

      // 3. Crear suscripción push
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      console.log('[Push] VAPID key:', vapidKey ? vapidKey.slice(0, 10) + '...' : 'UNDEFINED')

      if (!vapidKey) {
        console.error('[Push] VAPID key no encontrada en env')
        setLoading(false)
        return
      }

      console.log('[Push] Creando suscripción push...')
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      console.log('[Push] Suscripción creada:', JSON.stringify(sub.toJSON()).slice(0, 80))

      // 4. Guardar en Supabase
      console.log('[Push] Guardando en Supabase...')
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[Push] Usuario:', user?.id ?? 'NO USER')

      if (!user) {
        console.error('[Push] No hay usuario autenticado')
        setLoading(false)
        return
      }

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        subscription: sub.toJSON(),
      }, { onConflict: 'user_id' })

      if (error) {
        console.error('[Push] Error guardando en Supabase:', error)
      } else {
        console.log('[Push] ✅ Guardado en Supabase correctamente')
        setSubscribed(true)
      }

    } catch (err) {
      console.error('[Push] Error en subscribe:', err)
    }

    setLoading(false)
  }

  const unsubscribe = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('push_subscriptions').delete().eq('user_id', user.id)
      }
      setSubscribed(false)
      console.log('[Push] Desuscripto correctamente')
    } catch (err) {
      console.error('[Push] Error al desuscribirse:', err)
    }
    setLoading(false)
  }

  return { permission, subscribed, loading, subscribe, unsubscribe }
}