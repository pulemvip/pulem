'use client'

import { usePushNotifications } from '@/lib/usePushNotifications'
import { Bell, X, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function PushBanner() {
  const { permission, subscribed, loading, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(false)

  // Ocultar solo si ya está suscripto, rechazó explícitamente, o cerró el banner
  if (subscribed || permission === 'denied' || dismissed) return null

  // Texto distinto si ya dio permiso pero no está suscripto
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
            <button
              onClick={() => setDismissed(true)}
              className="text-blue-400 hover:text-blue-200 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}