'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const redirigir = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: perfil } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      const rol = perfil?.rol ?? 'vendedor'

      if (rol === 'admin') {
        router.replace('/dashboard/admin')
      } else if (rol === 'jefe') {
        router.replace('/dashboard/user/stats')
      } else {
        router.replace('/dashboard/user/clientes')
      }
    }

    redirigir()
  }, [router])

  return (
    <div className="min-h-screen bg-[#0c0c0f] flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin" />
    </div>
  )
}