'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RerollPage() {
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [total, setTotal] = useState<number | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const router = useRouter()

  const generarPreview = async () => {
    setLoading(true)
    setSuccessMessage(null)

    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/reroll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ ejecutar: false }),
    })

    const data = await res.json()
    if (res.ok) {
      setPreview(data.preview || [])
      setTotal(data.total ?? 0)
    } else {
      alert(data.error || 'Error desconocido')
    }

    setLoading(false)
  }

  const confirmar = async () => {
    setExecuting(true)

    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/reroll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ ejecutar: true }),
    })

    setSuccessMessage(res.ok ? 'Reroll ejecutado correctamente.' : 'Ocurrió un error al ejecutar.')
    setExecuting(false)
    setShowConfirm(false)
    setPreview([])
    setTotal(null)
  }

  const visibleRows = preview.slice(0, 100)

  const desbloquearTodos = async () => {
    setUnlocking(true)
    setSuccessMessage(null)

    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/desbloquear-clientes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
    })

    const data = await res.json()
    if (res.ok) {
      setSuccessMessage(`Se desbloquearon ${data.totalDesbloqueados ?? 0} clientes correctamente.`)
      router.refresh()
    } else {
      setSuccessMessage(data.error || 'Error al desbloquear.')
    }

    setUnlocking(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">

      {/* MAIN CONTENT */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-12">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Reroll de Clientes</h1>
            <p className="text-zinc-400 text-sm sm:text-base">
              Redistribución inteligente de clientes con estado{' '}
              <span className="text-blue-500 font-semibold">Clientes</span>
            </p>
          </div>
        </div>

        {/* MÉTRICAS */}
        {total !== null && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <Card title="Clientes afectados" value={total} />
            <Card title="Vista previa visible" value={Math.min(100, total)} />
            <Card title="Estado" valueText="Simulación" textColor="text-blue-500" />
          </div>
        )}

        {/* ACCIONES */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg">Acciones masivas</h2>
            <p className="text-sm text-zinc-500">Operaciones administrativas globales</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <button
              onClick={generarPreview}
              disabled={loading}
              className="px-4 sm:px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? 'Generando...' : 'Generar Preview'}
            </button>

            <button
              onClick={desbloquearTodos}
              disabled={unlocking}
              className="px-4 sm:px-6 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 transition font-medium"
            >
              {unlocking ? 'Desbloqueando...' : 'Desbloquear Todos'}
            </button>
          </div>
        </div>

        {/* MENSAJE SUCCESS */}
        {successMessage && (
          <div className="bg-green-900/40 border border-green-700 text-green-400 rounded-xl p-4">
            {successMessage}
          </div>
        )}

        {/* TABLA */}
        {total !== null && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-6 overflow-x-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
              <div>
                <h2 className="font-semibold text-lg">Resultado ({total} cambios)</h2>
                {total > 100 && <p className="text-xs text-zinc-500 mt-1">Mostrando los primeros 100 registros</p>}
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                className="px-4 sm:px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition font-medium"
              >
                Confirmar Reroll
              </button>
            </div>

            {preview.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                No hay clientes para mostrar.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-zinc-800 text-zinc-400 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-3">Cliente</th>
                      <th className="text-left px-4 py-3">Vendedor Actual</th>
                      <th className="text-left px-4 py-3">Vendedor Nuevo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((item, index) => (
                      <tr key={item.cliente_id || index} className="border-t border-zinc-800 hover:bg-zinc-800/40 transition">
                        <td className="px-4 py-3 font-medium">{item.cliente_nombre || '—'}</td>
                        <td className="px-4 py-3 text-zinc-400">{item.vendedor_actual_nombre || '—'}</td>
                        <td className="px-4 py-3 text-blue-500 font-semibold flex items-center gap-2">
                          <span>➡</span> {item.vendedor_nuevo_nombre || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 w-full max-w-md space-y-6">
            <h3 className="text-xl font-semibold">Confirmar ejecución</h3>
            <p className="text-zinc-400 text-sm">
              Esta acción modificará permanentemente la asignación de clientes.
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
              >
                Cancelar
              </button>

              <button
                onClick={confirmar}
                disabled={executing}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 transition"
              >
                {executing ? 'Ejecutando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ title, value, valueText, textColor }: { title: string; value?: number; valueText?: string; textColor?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-md flex flex-col justify-between">
      <p className="text-sm sm:text-base text-zinc-400">{title}</p>
      <p className={`text-2xl sm:text-3xl font-bold mt-2 ${textColor || ''}`}>
        {value ?? valueText ?? '—'}
      </p>
    </div>
  )
}
