'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function RerollPage() {
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState<number | null>(null)

  const generarPreview = async () => {
    setLoading(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const res = await fetch('/api/reroll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ tipo: 'enviados', ejecutar: false }),
    })

    const data = await res.json()

    if (res.ok) {
      setPreview(data.preview)
      setTotal(data.total)
    } else {
      alert(data.error)
    }

    setLoading(false)
  }

  const confirmar = async () => {
    if (!confirm('¿Seguro que querés ejecutar el reroll?')) return

    const {
      data: { session },
    } = await supabase.auth.getSession()

    await fetch('/api/reroll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ tipo: 'enviados', ejecutar: true }),
    })

    alert('Reroll ejecutado')
    setPreview([])
    setTotal(null)
  }

  return (
    <main className="min-h-screen bg-black p-12">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Reroll de Clientes
          </h1>
          <p className="text-gray-500 mt-2">
            Redistribución manual de clientes con estado <b>enviado</b>
          </p>
        </div>

        {/* Card acción */}
        <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Generar Preview
            </h2>
            <p className="text-gray-500 text-sm">
              Simulación sin modificar la base
            </p>
          </div>

          <button
            onClick={generarPreview}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Generando...' : 'Preview Enviados'}
          </button>
        </div>

        {/* Resultado */}
        {total !== null && (
          <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-6 shadow-xl space-y-6">

            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">
                Resultado ({total} cambios)
              </h2>

              <button
                onClick={confirmar}
                className="bg-red-600 hover:bg-red-700 transition text-white px-6 py-2 rounded-lg font-semibold"
              >
                Confirmar Reroll
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#1f1f1f]">
              <table className="w-full text-sm">
                <thead className="bg-[#141414]">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Cliente
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Vendedor Actual
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Vendedor Nuevo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((item) => (
                    <tr
                      key={item.cliente_id}
                      className="border-t border-[#1f1f1f] hover:bg-[#161616] transition"
                    >
                      <td className="px-4 py-3 text-white font-medium">
                        {item.cliente_nombre}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {item.vendedor_actual_nombre}
                      </td>
                      <td className="px-4 py-3 text-blue-400 font-medium">
                        {item.vendedor_nuevo_nombre}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </main>
  )
}
