'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!email.trim() || !password.trim()) return

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      setError('Email o contraseña incorrectos')
    } else {
      router.push('/dashboard/user')
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#0c0c0f] flex flex-col items-center justify-center px-5 py-10">

      {/* Fondo sutil */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_#1a1a2e_0%,_#0c0c0f_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <Image
            src="/logo.png"
            alt="Logo"
            width={110}
            height={110}
            className="drop-shadow-2xl"
            priority
          />
        </motion.div>

        {/* Card */}
        <div className="w-full bg-[#0f0f14] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">

          <div className="space-y-1 mb-2">
            <h1 className="text-xl font-bold text-white">Bienvenido</h1>
            <p className="text-sm text-zinc-500">Ingresá con tu cuenta de staff</p>
          </div>

          <form onSubmit={login} className="space-y-3">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500 font-medium">Email</label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3.5 text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                placeholder="tu@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500 font-medium">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3.5 pr-12 text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 active:text-zinc-300 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-3.5 rounded-2xl text-sm font-bold active:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition mt-1"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Ingresando...</>
                : 'Ingresar'
              }
            </button>

          </form>
        </div>

        <p className="text-xs text-zinc-700 mt-6 text-center">
          ¿Problemas para ingresar? Contactá al administrador.
        </p>
      </motion.div>
    </main>
  )
}