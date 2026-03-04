'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Consumo = {
  id: string
  nombre: string
  tipo: 'free' | 'descuento'
  user_id: string
}

export default function ConsumosPage() {
  const [consumos, setConsumos] = useState<Consumo[]>([])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [tipo, setTipo] = useState<'free' | 'descuento'>('free')
  const [userIdActual, setUserIdActual] = useState('')
  const [userRole, setUserRole] = useState('cliente')
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

      const { data: perfil } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (perfil?.rol) setUserRole(perfil.rol)

      const { data } = await supabase
        .from('consumos')
        .select('*')
        .order('created_at', { ascending: true })

      setConsumos((data as Consumo[]) || [])
      setLoading(false)
    }

    cargarTodo()
  }, [])

  const cargarConsumos = async () => {
    const { data } = await supabase
      .from('consumos')
      .select('*')
      .order('created_at', { ascending: true })

    setConsumos((data as Consumo[]) || [])
  }

  const agregarConsumo = async () => {
    if (!nuevoNombre.trim()) return

    await supabase.from('consumos').insert({
      nombre: nuevoNombre,
      tipo,
      user_id: userIdActual,
    })

    setNuevoNombre('')
    setTipo('free')
    cargarConsumos()
  }

  const eliminarConsumo = async (id: string, ownerId: string) => {
    if (userRole !== 'admin' && ownerId !== userIdActual) return

    await supabase.from('consumos').delete().eq('id', id)
    setConsumos(prev => prev.filter(c => c.id !== id))
  }

  const limpiarLista = async () => {
    if (userRole !== 'admin') return

    await supabase.from('consumos').delete().neq('id', '')
    setConsumos([])
  }

  const copiarTodo = async () => {
    if (consumos.length === 0) return

    const hoy = new Date().toLocaleDateString('es-AR')

    const free = consumos
      .filter(c => c.tipo === 'free')
      .map(c => c.nombre)

    const descuento = consumos
      .filter(c => c.tipo === 'descuento')
      .map(c => c.nombre)

    const texto = `CONSUMOS ${hoy}

Nombre Combo Free
${free.join('\n')}

Nombre Descuento en Combo
${descuento.join('\n')}`

    await navigator.clipboard.writeText(texto.trim())
    alert('Copiado correctamente')
  }

  const totalFree = consumos.filter(c => c.tipo === 'free').length
  const totalDescuento = consumos.filter(c => c.tipo === 'descuento').length
  const misConsumos = consumos.filter(c => c.user_id === userIdActual).length

  if (loading) {
    return <div className="text-zinc-400">Cargando...</div>
  }

  return (
    <div className="space-y-4">

      {/* CONTADORES */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4">

        <div className="flex-1 text-center bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <div className="text-xs text-zinc-400">Combo Free</div>
          <div className="text-lg font-bold text-amber-400">
            {totalFree}
          </div>
        </div>

        <div className="flex-1 text-center bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <div className="text-xs text-zinc-400">Combo Descuento</div>
          <div className="text-lg font-bold text-blue-400">
            {totalDescuento}
          </div>
        </div>

        <div className="flex-1 text-center bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <div className="text-xs text-zinc-400">Tus consumos</div>
          <div className="text-lg font-bold text-green-500">
            {misConsumos}
          </div>
        </div>
      </div>

      {/* AGREGAR */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-2">

          <input
            className="w-full sm:flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100 placeholder-zinc-500"
            placeholder="Nombre del cliente"
            value={nuevoNombre}
            onChange={e => setNuevoNombre(e.target.value)}
          />

          <select
            value={tipo}
            onChange={e => setTipo(e.target.value as any)}
            className="w-full sm:w-auto bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100"
          >
            <option value="free">Free</option>
            <option value="descuento">Descuento</option>
          </select>

          <button
            onClick={agregarConsumo}
            className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Agregar
          </button>

        </div>
      </div>

      {/* BUSCADOR + LISTA */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">

        <div className="flex flex-col sm:flex-row gap-2">

          <input
            type="text"
            placeholder="Buscar cliente..."
            className="w-full sm:flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100 placeholder-zinc-500"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <button
            onClick={copiarTodo}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Copiar
          </button>

          {userRole === 'admin' && (
            <button
              onClick={limpiarLista}
              className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Limpiar
            </button>
          )}

        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {consumos
            .filter(c =>
              c.nombre.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(c => (
              <div
                key={c.id}
                className="border border-zinc-800 rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{c.nombre}</div>
                  <div className="text-xs text-zinc-400">
                    {c.tipo === 'free'
                      ? 'Combo Free'
                      : 'Combo Descuento'}
                  </div>
                </div>

                {(userRole === 'admin' || c.user_id === userIdActual) && (
                  <button
                    onClick={() => eliminarConsumo(c.id, c.user_id)}
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