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

const getSemanaActual = (): number => {
  const hoy = new Date()
  const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1)
  const dias = Math.floor(
    (hoy.getTime() - primerDiaAnio.getTime()) / (24 * 60 * 60 * 1000)
  )
  const semana = Math.ceil((dias + primerDiaAnio.getDay() + 1) / 7)
  return Number(`${hoy.getFullYear()}${semana}`)
}

export default function DashboardPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [invitados, setInvitados] = useState<Invitado[]>([])
  const [mensaje, setMensaje] = useState('')
  const [nuevoInvitado, setNuevoInvitado] = useState('')
  const [loading, setLoading] = useState(true)

  const [tabActual, setTabActual] = useState<'clientes' | 'invitados' | 'ranking'>('clientes')
  const [userIdActual, setUserIdActual] = useState('')

  const semanaActual = getSemanaActual()

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

      await cargarInvitados()
      setLoading(false)
    }

    cargarTodo()
  }, [])

  const cargarInvitados = async () => {
    const { data } = await supabase
      .from('invitados')
      .select('*')
      .order('nombre')

    setInvitados((data as Invitado[]) || [])
  }

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

  const agregarInvitado = async () => {
    if (!nuevoInvitado.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('invitados').insert({
      nombre: nuevoInvitado,
      user_id: user.id,
      user_email: user.email,
    })

    setNuevoInvitado('')
    cargarInvitados()
  }

  const eliminarInvitado = async (id: number) => {
    await supabase
      .from('invitados')
      .delete()
      .eq('id', id)
      .eq('user_id', userIdActual)

    setInvitados(prev => prev.filter(i => i.id !== id))
  }

  /* 🔢 RESUMEN */
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


/* 📲 RANKING MENSAJES ENVIADOS (SEMANA ACTUAL) */
const rankingMensajes = useMemo(() => {
  const conteo: Record<string, number> = {}

  clientes.forEach(c => {
    if (c.ultima_semana_enviada === semanaActual) {
      conteo[c.user_id] = (conteo[c.user_id] || 0) + 1
    }
  })

  return Object.entries(conteo)
    .map(([user_id, total]) => ({ user_id, total }))
    .sort((a, b) => b.total - a.total)
}, [clientes, semanaActual])


const getEmailByUserId = (userId: string) => {
  return invitados.find(i => i.user_id === userId)?.user_email ?? userId
}


  return (
    <div className="space-y-6">
      {/* TABS */}
      <div className="flex gap-2">
        {['clientes', 'invitados', 'ranking'].map(tab => (
          <button
            key={tab}
            onClick={() => setTabActual(tab as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tabActual === tab
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
          >
            {tab === 'clientes'
              ? 'Clientes'
              : tab === 'invitados'
                ? 'Invitados'
                : 'Ranking'}
          </button>
        ))}
      </div>

      {/* CLIENTES */}
      {tabActual === 'clientes' && (
        <>
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
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3
              text-sm text-zinc-100 placeholder-zinc-500
              focus:outline-none focus:ring-2 focus:ring-zinc-400"
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

          {/* CARDS CLIENTES */}
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
                      className={`text-xs px-2 py-1 rounded-full ${bloqueado
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-amber-900/40 text-amber-300'
                        }`}
                    >
                      {bloqueado ? 'Bloqueado' : 'Disponible'}
                    </span>

                    <button
                      disabled={bloqueado}
                      onClick={() => enviarWhatsapp(c)}
                      className={`px-3 py-1 rounded-lg text-sm ${bloqueado
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
        </>
      )}

      {/* INVITADOS */}
      {tabActual === 'invitados' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-lg">Invitados</h2>

          <div className="flex gap-2">
            <input
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-2
              text-zinc-100 placeholder-zinc-500"
              placeholder="Nombre del invitado"
              value={nuevoInvitado}
              onChange={e => setNuevoInvitado(e.target.value)}
            />
            <button
              onClick={agregarInvitado}
              className="bg-green-600 text-white px-4 rounded-lg"
            >
              Agregar
            </button>
          </div>

          <div className="space-y-2">
            {invitados.map(i => (
              <div
                key={i.id}
                className="border border-zinc-800 rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{i.nombre}</div>
                  <div className="text-xs text-zinc-400">{i.user_email}</div>
                </div>

                {i.user_id === userIdActual && (
                  <button
                    onClick={() => eliminarInvitado(i.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RANKING */}
{tabActual === 'ranking' && (
  <div className="space-y-6">

    {/* 🧑‍🤝‍🧑 RANKING INVITACIONES */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
      <h2 className="font-semibold text-lg">🧑‍🤝‍🧑 Ranking de Invitaciones</h2>

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

    {/* 📲 RANKING MENSAJES */}
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
              <div>
                <div className="font-medium">
                  {getEmailByUserId(r.user_id)}
                </div>
                <div className="text-xs text-zinc-400">
                  Mensajes enviados
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

  </div>
)}

    </div>
  )
}
