'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Verificar si ya hay sesión activa al cargar
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.push('/dashboard/clientes')
    }
    checkSession()
  }, [router])

  const login = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)
    if (error) setError(error.message)
    else router.push('/dashboard/clientes')
  }

  return (
    <main className="flex items-center justify-center h-[100dvh] overflow-hidden bg-gradient-to-br from-black via-gray-900 to-blue-900">
      <div className="w-96 max-w-[90vw] p-8 bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-2xl space-y-6 flex flex-col items-center transition duration-500 sm:hover:scale-105">

        <div className="w-32 h-32 relative">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
        </div>

        <form className="w-full flex flex-col gap-4" onSubmit={login}>
          <input
            className="w-full border border-gray-700 rounded-xl p-3 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full border border-gray-700 rounded-xl p-3 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-xl font-semibold hover:bg-blue-700 transition sm:hover:scale-105"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  )
}
