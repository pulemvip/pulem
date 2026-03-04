'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

export const getSemanaActual = (): number => {
  const hoy = new Date()
  const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1)
  const dias = Math.floor(
    (hoy.getTime() - primerDiaAnio.getTime()) / (24 * 60 * 60 * 1000)
  )
  const semana = Math.ceil((dias + primerDiaAnio.getDay() + 1) / 7)
  return Number(`${hoy.getFullYear()}${semana}`)
}

export function useDashboardData() {
  const semanaActual = getSemanaActual()

  const [clientes, setClientes] = useState<any[]>([])
  const [invitados, setInvitados] = useState<any[]>([])
  const [rankingMensajes, setRankingMensajes] = useState<any[]>([])
  const [mensaje, setMensaje] = useState('')
  const [home, setHome] = useState<any>(null)
  const [userIdActual, setUserIdActual] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarTodo = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      setUserIdActual(user.id)

      const { data: clientesData } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', user.id)
        .order('nombre')

      setClientes(clientesData || [])

      const { data: invitadosData } = await supabase
        .from('invitados')
        .select('*')
        .order('nombre')

      setInvitados(invitadosData || [])

      const { data: rankingData } = await supabase
        .from('ranking_mensajes_semana')
        .select('*')
        .eq('ultima_semana_enviada', semanaActual)
        .order('total', { ascending: false })

      setRankingMensajes(rankingData || [])

      const { data: homeData } = await supabase
        .from('home_content')
        .select('*')
        .single()

      setHome(homeData)

      setLoading(false)
    }

    cargarTodo()
  }, [semanaActual])

  return {
    clientes,
    invitados,
    rankingMensajes,
    mensaje,
    setMensaje,
    home,
    setHome,
    userIdActual,
    semanaActual,
    loading,
  }
}