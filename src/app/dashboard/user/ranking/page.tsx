'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

type Invitado = {
  id: number
  nombre: string
  user_id: string
  user_email: string
}

type RankingMensaje = {
  user_id: string
  total: number
  ultima_semana_enviada: number
}

const getSemanaActual = (): number => {
  const hoy = new Date()
  const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1)
  const dias = Math.floor(
    (hoy.getTime() - primerDiaAnio.getTime()) / (24 * 60 * 60 * 1000)
  )
  const semana = Math.ceil((dias + primerDiaAnio.getDay() + 1) / 7)
  return Number(`${hoy.getFullYear()}${semana}`)
}

export default function RankingPage() {
  const [invitados, setInvitados] = useState<Invitado[]>([])
  const [rankingMensajes, setRankingMensajes] = useState<RankingMensaje[]>([])
  const [loading, setLoading] = useState(true)

  const semanaActual = getSemanaActual()

  useEffect(() => {
    const cargarTodo = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: invitadosData } = await supabase
        .from('invitados')
        .select('*')

      setInvitados((invitadosData as Invitado[]) || [])

      const { data: rankingData, error } = await supabase
        .from('ranking_mensajes_semana')
        .select('user_id, total, ultima_semana_enviada')
        .eq('ultima_semana_enviada', semanaActual)
        .order('total', { ascending: false })

      if (!error) {
        setRankingMensajes((rankingData as RankingMensaje[]) || [])
      }

      setLoading(false)
    }

    cargarTodo()
  }, [semanaActual])

  /* 🧑‍🤝‍🧑 RANKING INVITACIONES */
  const rankingInvitaciones = useMemo(() => {
    const conteo: Record<string, { email: string; total: number }> = {}

    invitados.forEach(i => {
      if (!conteo[i.user_id]) {
        conteo[i.user_id] = {
          email: i.user_email,
          total: 0,
        }
      }
      conteo[i.user_id].total++
    })

    return Object.values(conteo).sort((a, b) => b.total - a.total)
  }, [invitados])

  const getEmailByUserId = (userId: string) => {
    return invitados.find(i => i.user_id === userId)?.user_email ?? userId
  }

  if (loading) {
    return <div className="text-zinc-400">Cargando...</div>
  }

  return (
    <div className="space-y-6">

      {/* RANKING INVITACIONES */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
        <h2 className="font-semibold text-lg">
          🧑‍🤝‍🧑 Ranking de Invitaciones
        </h2>

        {rankingInvitaciones.length === 0 && (
          <div className="text-sm text-zinc-400">
            Todavía no hay invitados cargados
          </div>
        )}

        <div className="space-y-2">
          {rankingInvitaciones.map((r, index) => (
            <div
              key={r.email}
              className="flex justify-between items-center border border-zinc-800 rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <div className="font-bold text-amber-400">
                  #{index + 1}
                </div>
                <div>
                  <div className="font-medium">{r.email}</div>
                  <div className="text-xs text-zinc-400">
                    Invitaciones
                  </div>
                </div>
              </div>

              <div className="text-lg font-bold text-green-500">
                {r.total}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RANKING MENSAJES */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
        <h2 className="font-semibold text-lg">
          📲 Ranking de Mensajes – Semana {semanaActual}
        </h2>

        {rankingMensajes.length === 0 && (
          <div className="text-sm text-zinc-400">
            Todavía no se enviaron mensajes
          </div>
        )}

        <div className="space-y-2">
          {rankingMensajes.map((r, index) => (
            <div
              key={r.user_id}
              className="flex justify-between items-center border border-zinc-800 rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <div className="font-bold text-amber-400">
                  #{index + 1}
                </div>
                <div className="font-medium">
                  {getEmailByUserId(r.user_id)}
                </div>
              </div>

              <div className="font-bold text-green-500">
                {r.total}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}