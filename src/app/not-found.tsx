'use client'

import { motion } from 'framer-motion'

export default function NotFound() {

  return (
    <div className="min-h-screen bg-[#0c0c0f] flex flex-col items-center justify-center px-6 text-center">

      {/* Número 404 grande de fondo */}
      <div className="relative select-none mb-8">
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-[140px] sm:text-[200px] font-black text-zinc-900 leading-none tracking-tighter"
        >
          404
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-3xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-xl">
            <span className="text-2xl">🔍</span>
          </div>
        </motion.div>
      </div>

      {/* Texto */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="space-y-2 mb-8"
      >
        <h1 className="text-xl font-semibold text-white">Página no encontrada</h1>
        <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">
          La página que buscás no existe o fue movida.
        </p>
      </motion.div>

      {/* Botón */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        onClick={() => window.location.href = 'https://pulemvip.com'}
        className="px-6 py-3 rounded-2xl bg-white text-black text-sm font-semibold active:bg-zinc-200 transition"
      >
        Volver al inicio
      </motion.button>
    </div>
  )
}