'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Invitado = {
  id: number
  nombre: string
  user_id: string
  user_email: string
}

export default function InvitadosPage() {
  const [invitados, setInvitados] = useState<Invitado[]>([])
  const [nuevoInvitado, setNuevoInvitado] = useState('')
  const [userIdActual, setUserIdActual] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarTodo = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      setUserIdActual(user.id)

      const { data } = await supabase
        .from('invitados')
        .select('*')
        .order('nombre')

      setInvitados((data as Invitado[]) || [])
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

  if (loading) {
    return <div className="text-zinc-400">Cargando...</div>
  }

  return (
    <div className="space-y-4">

      {/* CONTADORES */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex gap-4">
        <div className="flex-1 text-center bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <div className="text-xs text-zinc-400">Total invitados</div>
          <div className="text-lg font-bold text-amber-400">
            {invitados.length}
          </div>
        </div>

        <div className="flex-1 text-center bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <div className="text-xs text-zinc-400">Tus invitados</div>
          <div className="text-lg font-bold text-green-500">
            {invitados.filter(i => i.user_id === userIdActual).length}
          </div>
        </div>
      </div>

      {/* AGREGAR INVITADO */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex gap-2">
        <input
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100 placeholder-zinc-500"
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

      {/* BUSCADOR + LISTA */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
        <input
          type="text"
          placeholder="Buscar invitado..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100 placeholder-zinc-500"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {invitados
            .filter(i =>
              i.nombre.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(i => (
              <div
                key={i.id}
                className="border border-zinc-800 rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{i.nombre}</div>
                  <div className="text-xs text-zinc-400">
                    {i.user_email}
                  </div>
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
    </div>
  )
}