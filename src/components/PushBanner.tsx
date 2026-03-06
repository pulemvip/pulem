'use client'

// Componente para pedir permiso de notificaciones al staff
// Usarlo en el DashboardLayout, dentro del <main> o justo después del header

import { usePushNotifications } from '@/lib/usePushNotifications'
import { Bell, BellOff, X } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function PushBanner() {
  const { permission, subscribed, loading, subscribe, unsubscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(false)

  // No mostrar si ya está suscripto, si rechazó, o si cerró el banner
  if (subscribed || permission === 'denied' || dismissed) return null

  // Si ya dio permiso pero no está suscripto (raro, pero puede pasar)
  if (permission === 'granted' && !subscribed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="mx-4 mt-4 md:mx-0 md:mt-0 md:mb-4"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-3 min-w-0">
            <Bell size={16} className="text-blue-400 shrink-0" />
            <p className="text-sm text-blue-300 truncate">
              Activá las notificaciones para recibir avisos del admin
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={subscribe}
              disabled={loading}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Activando...' : 'Activar'}
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
