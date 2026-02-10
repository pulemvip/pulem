'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          // El usuario fue redirigido desde el link de reset
          setShowForm(true)
        }
      }
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setError('Completá ambos campos')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (error) setError(error.message)
    else router.push('/login')
  }

  if (!showForm) {
    return (
      <div className="text-center text-white p-6">
        Esperando redirección desde el link de recuperación…
      </div>
    )
  }

  return (
    <main className="flex items-center justify-center h-[100dvh] bg-gradient-to-br from-black via-gray-900 to-blue-900">
      <div className="w-96 p-8 bg-gray-900/80 rounded-3xl shadow-xl space-y-4">
        <div className="w-32 h-32 relative mx-auto">
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            className="object-contain"
          />
        </div>
        <h2 className="text-xl text-white text-center">
          Ingresá tu nueva contraseña
        </h2>

        <input
          type="password"
          placeholder="Nueva contraseña"
          className="w-full p-3 rounded-lg border bg-gray-800 text-white"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
          className="w-full p-3 rounded-lg border bg-gray-800 text-white"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg"
        >
          {loading ? 'Cambiando…' : 'Cambiar contraseña'}
        </button>
      </div>
    </main>
  )
}
