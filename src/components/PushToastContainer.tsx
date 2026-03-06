'use client'

// /components/PushToastContainer.tsx
// Mostrar en el DashboardLayout — muestra toasts cuando llegan pushes

import { usePushToast } from '@/lib/usePushToast'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function PushToastContainer() {
  const { toasts, dismiss } = usePushToast()
  const router = useRouter()

  return (
    <div className="fixed top-16 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[90] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto"
          >
            <div className="bg-[#111118] border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
              {/* Barra superior animada */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 6, ease: 'linear' }}
                className="h-0.5 bg-blue-500 origin-left"
              />

              <div className="flex items-start gap-3 px-4 py-3.5">
                {/* Ícono */}
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell size={14} className="text-blue-400" />
                </div>

                {/* Contenido */}
                <button
                  onClick={() => {
                    dismiss(toast.id)
                    if (toast.url) router.push(toast.url)
                  }}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm font-semibold text-white leading-tight">
                    {toast.title}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    {toast.body}
                  </p>
                </button>

                {/* Cerrar */}
                <button
                  onClick={() => dismiss(toast.id)}
                  className="text-zinc-600 hover:text-zinc-300 active:text-white transition shrink-0 mt-0.5"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
