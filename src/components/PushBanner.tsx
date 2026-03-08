'use client'

import { usePushNotifications } from '@/lib/usePushNotifications'
import { Bell, X, Loader2, Share, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function useIsIOS() {
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const installed = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true
    setIsIOS(ios)
    setIsInstalled(installed)
  }, [])

  return { isIOS, isInstalled }
}

function IOSInstallBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <div className="px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <Bell size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium">Activá las notificaciones</p>
                <p className="text-xs text-blue-400/70 mt-1 leading-relaxed">
                  En iPhone, instalá la app primero:{' '}
                  <span className="inline-flex items-center gap-1 font-medium">
                    tocá <Share size={11} className="inline" /> y luego
                    "Agregar a inicio" <Plus size={11} className="inline" />
                  </span>
                </p>
              </div>
            </div>
            <button onClick={onDismiss} className="text-blue-400 hover:text-blue-200 transition shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

const DISMISS_KEY = 'push_banner_dismissed'

export function PushBanner() {
  const { permission, subscribed, loading, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(true) // empieza oculto hasta que carga localStorage
  const { isIOS, isInstalled } = useIsIOS()

  useEffect(() => {
    const stored = localStorage.getItem(DISMISS_KEY)
    if (!stored) setDismissed(false)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  // iOS no instalada → mostrar banner de instalación
  if (isIOS && !isInstalled && !dismissed) {
    return <IOSInstallBanner onDismiss={dismiss} />
  }

  // Ocultar si ya suscripto, rechazó, o cerró el banner
  if (subscribed || permission === 'denied' || dismissed) return null

  // Notificaciones no soportadas (browser viejo, etc)
  if (typeof window !== 'undefined' && !('Notification' in window)) return null

  const texto = permission === 'granted'
    ? 'Reactivá las notificaciones para recibir avisos'
    : 'Activá las notificaciones para recibir avisos del admin'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-3 min-w-0">
            <Bell size={16} className="text-blue-400 shrink-0" />
            <p className="text-sm text-blue-300 truncate">{texto}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={subscribe}
              disabled={loading}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              {loading
                ? <><Loader2 size={12} className="animate-spin" /> Activando...</>
                : 'Activar'
              }
            </button>
            <button onClick={dismiss} className="text-blue-400 hover:text-blue-200 transition">
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}