'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [totalClientes, setTotalClientes] = useState(0)
  const [enviados, setEnviados] = useState(0)
  const [pendientes, setPendientes] = useState(0)
  const [vendedoresActivos, setVendedoresActivos] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)

      // Total clientes
      const { count: total } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })

      // Clientes enviados
      const { count: enviadosCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'enviado')

      // Clientes pendientes
      const { count: pendientesCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente')

      // Vendedores activos (user_id únicos)
      const { data: vendedoresData } = await supabase
        .from('clientes')
        .select('user_id')

      const vendedoresUnicos = new Set(
        vendedoresData?.map(c => c.user_id)
      )

      setTotalClientes(total || 0)
      setEnviados(enviadosCount || 0)
      setPendientes(pendientesCount || 0)
      setVendedoresActivos(vendedoresUnicos.size || 0)

      setLoading(false)
    }

    fetchMetrics()
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Panel Admin</h1>

      {loading ? (
        <div className="text-zinc-500">Cargando métricas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card title="Clientes Totales" value={totalClientes} />
          <Card title="Clientes Enviados" value={enviados} />
          <Card title="Clientes Pendientes" value={pendientes} />
          <Card title="Vendedores Activos" value={vendedoresActivos} />
        </div>
      )}
    </div>
  )
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-md">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}
