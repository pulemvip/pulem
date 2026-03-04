'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

type Cliente = {
  id: number
  nombre: string
  telefono: string
  estado: string | null
  ultima_semana_enviada: number | null
  user_id: string
}

type Invitado = {
  id: number
  nombre: string
  user_id: string
  user_email: string
}

type RankingMensaje = {
  user_id: string
  user_email: string
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

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)

  const semanaActual = getSemanaActual()

  useEffect(() => {
    const cargarTodo = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: clientesData } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', user.id)
        .order('nombre')

      setClientes((clientesData as Cliente[]) || [])

      const { data: settings } = await supabase
        .from('user_settings')
        .select('mensaje')
        .eq('user_id', user.id)
        .single()

      setMensaje(
        settings?.mensaje ??
        `Hola {{nombre}} 👋
Te escribo de PULEM VIP.
¿Te paso info de la próxima fecha? 🔥`
      )

      setLoading(false)
    }

    cargarTodo()
  }, [semanaActual])

  const guardarMensaje = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('user_settings').upsert({
      user_id: user.id,
      mensaje,
    })

    alert('Mensaje guardado')
  }

  const enviarWhatsapp = async (cliente: Cliente) => {
    const texto = mensaje.replace('{{nombre}}', cliente.nombre)
    const encoded = encodeURIComponent(texto)

    window.open(`https://wa.me/${cliente.telefono}?text=${encoded}`, '_blank')

    await supabase
      .from('clientes')
      .update({
        estado: 'enviado',
        ultima_semana_enviada: semanaActual,
      })
      .eq('id', cliente.id)

    setClientes(prev =>
      prev.map(c =>
        c.id === cliente.id
          ? { ...c, ultima_semana_enviada: semanaActual }
          : c
      )
    )
  }

  const resumen = useMemo(() => {
    const disponibles = clientes.filter(
      c => c.ultima_semana_enviada !== semanaActual
    ).length

    const bloqueados = clientes.length - disponibles

    return {
      total: clientes.length,
      disponibles,
      bloqueados,
    }
  }, [clientes, semanaActual])

  if (loading) return null

  return (
    <div className="space-y-6">

      {/* 🔢 RESUMEN */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
          <div className="text-xs text-zinc-400">Disponibles</div>
          <div className="text-xl font-bold text-amber-300">
            {resumen.disponibles}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
          <div className="text-xs text-zinc-400">Bloqueados</div>
          <div className="text-xl font-bold text-zinc-400">
            {resumen.bloqueados}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
          <div className="text-xs text-zinc-400">Total</div>
          <div className="text-xl font-bold">{resumen.total}</div>
        </div>
      </div>

      {/* MENSAJE */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Mensaje de WhatsApp</h2>

        <textarea
          rows={4}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3"
          value={mensaje}
          onChange={e => setMensaje(e.target.value)}
        />

        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-400">
            Usá <b>{'{{nombre}}'}</b>
          </span>
          <button
            onClick={guardarMensaje}
            className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium"
          >
            Guardar
          </button>
        </div>
      </div>

      {/* CLIENTES */}
      <div className="space-y-3">
        {clientes.map(c => {
          const bloqueado = c.ultima_semana_enviada === semanaActual
          return (
            <div
              key={c.id}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2"
            >
              <div className="font-semibold">{c.nombre}</div>
              <div className="text-sm text-zinc-400">{c.telefono}</div>

              <div className="flex justify-between items-center">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    bloqueado
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-amber-900/40 text-amber-300'
                  }`}
                >
                  {bloqueado ? 'Bloqueado' : 'Disponible'}
                </span>

                <button
                  disabled={bloqueado}
                  onClick={() => enviarWhatsapp(c)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    bloqueado
                      ? 'bg-zinc-800 text-zinc-500'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  WhatsApp
                </button>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}