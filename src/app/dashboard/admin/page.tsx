'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)

  const [total, setTotal] = useState(0)
  const [pendientes, setPendientes] = useState(0)
  const [enviados, setEnviados] = useState(0)
  const [enviadosSemana, setEnviadosSemana] = useState(0)
  const [vendedoresActivos, setVendedoresActivos] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const semanaActual = getISOWeek()

      // TOTAL
      const { count: totalCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })

      // PENDIENTES
      const { count: pendientesCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente')

      // ENVIADOS
      const { count: enviadosCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'enviado')

      // ENVIADOS ESTA SEMANA
      const { count: enviadosSemanaCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('ultima_semana_enviada', semanaActual)

      // VENDEDORES ACTIVOS
      const { data } = await supabase
        .from('clientes')
        .select('user_id')

      const vendedoresUnicos = new Set(data?.map(c => c.user_id))

      setTotal(totalCount || 0)
      setPendientes(pendientesCount || 0)
      setEnviados(enviadosCount || 0)
      setEnviadosSemana(enviadosSemanaCount || 0)
      setVendedoresActivos(vendedoresUnicos.size || 0)

      setLoading(false)
    }

    fetchData()
  }, [])

  const porcentajeAsignado =
    total > 0 ? Math.round((enviados / total) * 100) : 0

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-center sm:text-left">
        Panel Admin
      </h1>

      {loading ? (
        <div className="text-zinc-500 text-center sm:text-left">
          Cargando métricas...
        </div>
      ) : (
        <>
          {/* GRID RESPONSIVE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            <Card title="Clientes Totales" value={total} />
            <Card title="Pendientes" value={pendientes} />
            <Card title="Enviados" value={enviados} />
            <Card title="Enviados Semana" value={enviadosSemana} />
            <Card title="Vendedores Activos" value={vendedoresActivos} />
          </div>

          {/* PROGRESO */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-2xl">
            <p className="text-sm sm:text-base text-zinc-400">Progreso general</p>
            <p className="text-xl sm:text-2xl font-bold mt-2">
              {porcentajeAsignado}% asignado
            </p>

            <div className="w-full bg-zinc-800 rounded-full h-2 sm:h-3 mt-3 sm:mt-4">
              <div
                className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all"
                style={{ width: `${porcentajeAsignado}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-2xl shadow-md flex flex-col justify-between">
      <p className="text-sm sm:text-base text-zinc-400">{title}</p>
      <p className="text-2xl sm:text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}

// ISO WEEK (ej: 2026-07)
function getISOWeek() {
  const now = new Date()
  const year = now.getFullYear()

  const oneJan = new Date(year, 0, 1)
  const numberOfDays =
    Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000)) + 1

  const week = Math.ceil(numberOfDays / 7)

  return `${year}-${week}`
}
