'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { UserAvatar } from '@/components/UserAvatar'
import { motion } from 'framer-motion'
import { Trophy, Users, MessageCircle } from 'lucide-react'

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

type UsuarioPerfil = {
  id: string
  email: string
  avatar_url: string | null
}

const getSemanaActual = (): number => {
  const hoy = new Date()
  const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1)
  const dias = Math.floor((hoy.getTime() - primerDiaAnio.getTime()) / (24 * 60 * 60 * 1000))
  return Number(`${hoy.getFullYear()}${Math.ceil((dias + primerDiaAnio.getDay() + 1) / 7)}`)
}

const MEDALLAS = ['🥇', '🥈', '🥉']

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800 animate-pulse">
      <div className="w-6 h-4 bg-zinc-800 rounded" />
      <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" />
      <div className="flex-1 h-3.5 bg-zinc-800 rounded w-1/3" />
      <div className="w-8 h-6 bg-zinc-800 rounded" />
    </div>
  )
}

function RankingList({
  items,
  avatarMap,
}: {
  items: { id: string; email: string; total: number }[]
  avatarMap: Record<string, string | null>
}) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-600 text-center py-10">No hay datos todavía</p>
  }

  return (
    <div className="divide-y divide-zinc-800">
      {items.map((r, idx) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.04, duration: 0.25 }}
          className={`flex items-center gap-3 px-4 py-4 transition ${
            idx === 0 ? 'bg-amber-500/5' : 'hover:bg-zinc-800/20'
          }`}
        >
          {/* Posición */}
          <div className="w-7 text-center shrink-0">
            {idx < 3
              ? <span className="text-base">{MEDALLAS[idx]}</span>
              : <span className="text-xs font-bold text-zinc-600">#{idx + 1}</span>
            }
          </div>

          {/* Avatar */}
          <UserAvatar email={r.email} avatarUrl={avatarMap[r.id] ?? null} size="sm" />

          {/* Email */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-100 truncate">{r.email}</p>
          </div>

          {/* Total */}
          <div className={`text-lg font-bold shrink-0 ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-700' : 'text-zinc-400'}`}>
            {r.total}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default function RankingPage() {
  const [invitados, setInvitados] = useState<Invitado[]>([])
  const [rankingMensajes, setRankingMensajes] = useState<RankingMensaje[]>([])
  const [perfiles, setPerfiles] = useState<UsuarioPerfil[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'invitaciones' | 'mensajes'>('invitaciones')

  const semanaActual = getSemanaActual()

  useEffect(() => {
    const cargarTodo = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const [
        { data: invitadosData },
        { data: rankingData },
        { data: perfilesData },
      ] = await Promise.all([
        supabase.from('invitados').select('*'),
        supabase.from('ranking_mensajes_semana')
          .select('user_id, total, ultima_semana_enviada')
          .eq('ultima_semana_enviada', semanaActual)
          .order('total', { ascending: false }),
        supabase.from('usuarios').select('id, email, avatar_url'),
      ])

      setInvitados((invitadosData as Invitado[]) || [])
      setRankingMensajes((rankingData as RankingMensaje[]) || [])
      setPerfiles((perfilesData as UsuarioPerfil[]) || [])
      setLoading(false)
    }
    cargarTodo()
  }, [semanaActual])

  const avatarMap = useMemo(() => {
    const map: Record<string, string | null> = {}
    perfiles.forEach(p => { map[p.id] = p.avatar_url })
    return map
  }, [perfiles])

  const emailMap = useMemo(() => {
    const map: Record<string, string> = {}
    perfiles.forEach(p => { map[p.id] = p.email })
    invitados.forEach(i => { if (!map[i.user_id]) map[i.user_id] = i.user_email })
    return map
  }, [perfiles, invitados])

  const rankingInvitaciones = useMemo(() => {
    const conteo: Record<string, number> = {}
    invitados.forEach(i => { conteo[i.user_id] = (conteo[i.user_id] || 0) + 1 })
    return Object.entries(conteo)
      .map(([id, total]) => ({ id, email: emailMap[id] ?? id, total }))
      .sort((a, b) => b.total - a.total)
  }, [invitados, emailMap])

  const rankingMensajesFormateado = useMemo(() => {
    return rankingMensajes.map(r => ({
      id: r.user_id,
      email: emailMap[r.user_id] ?? r.user_id,
      total: r.total,
    }))
  }, [rankingMensajes, emailMap])

  const activeItems = tab === 'invitaciones' ? rankingInvitaciones : rankingMensajesFormateado

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto space-y-5 pb-24"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Trophy size={16} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Ranking</h1>
          <p className="text-sm text-zinc-500">Semana {semanaActual}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900">
        {([
          { key: 'invitaciones', label: 'Invitaciones', icon: Users },
          { key: 'mensajes', label: 'Mensajes', icon: MessageCircle },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${
              tab === key
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-500 active:bg-zinc-800'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Podio top 3 si hay datos */}
        {!loading && activeItems.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 p-4 pb-3 border-b border-zinc-800">
            {/* 2do lugar */}
            <div className="flex flex-col items-center gap-2 pt-4">
              <UserAvatar email={activeItems[1].email} avatarUrl={avatarMap[activeItems[1].id] ?? null} size="md" />
              <p className="text-[11px] text-zinc-400 truncate w-full text-center">{activeItems[1].email.split('@')[0]}</p>
              <div className="text-sm font-bold text-zinc-300">{activeItems[1].total}</div>
              <div className="text-xl">🥈</div>
            </div>

            {/* 1er lugar */}
            <div className="flex flex-col items-center gap-2 -mt-2">
              <div className="relative">
                <UserAvatar email={activeItems[0].email} avatarUrl={avatarMap[activeItems[0].id] ?? null} size="lg" className="ring-2 ring-amber-400/50" />
              </div>
              <p className="text-[11px] text-zinc-200 font-medium truncate w-full text-center">{activeItems[0].email.split('@')[0]}</p>
              <div className="text-base font-bold text-amber-400">{activeItems[0].total}</div>
              <div className="text-2xl">🥇</div>
            </div>

            {/* 3er lugar */}
            <div className="flex flex-col items-center gap-2 pt-6">
              <UserAvatar email={activeItems[2].email} avatarUrl={avatarMap[activeItems[2].id] ?? null} size="md" />
              <p className="text-[11px] text-zinc-400 truncate w-full text-center">{activeItems[2].email.split('@')[0]}</p>
              <div className="text-sm font-bold text-amber-700">{activeItems[2].total}</div>
              <div className="text-xl">🥉</div>
            </div>
          </div>
        )}

        {/* Lista completa */}
        {loading ? (
          <div>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : (
          <RankingList items={activeItems} avatarMap={avatarMap} />
        )}
      </div>
    </motion.div>
  )
}