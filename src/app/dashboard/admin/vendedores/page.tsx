'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Vendedor = {
  vendedor_id: string
  email: string
  rol: string
  activo: boolean
  total: number
  enviados: number
  pendientes: number
  conversion: number
}

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('vendedor')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchVendedores()
  }, [])

  const getSessionToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    return session?.access_token
  }

  const fetchVendedores = async () => {
    setLoading(true)

    const token = await getSessionToken()

    const res = await fetch('/api/vendedores', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await res.json()
    setVendedores(data || [])
    setLoading(false)
  }

  const crearVendedor = async () => {
    setCreating(true)
    const token = await getSessionToken()

    const res = await fetch('/api/vendedores/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email, password, rol }),
    })

    const data = await res.json()

    if (res.ok) {
      setEmail('')
      setPassword('')
      setRol('vendedor')
      fetchVendedores()
    } else {
      alert(data.error)
    }

    setCreating(false)
  }

  const actualizarVendedor = async (
    id: string,
    campo: string,
    valor: any
  ) => {
    const token = await getSessionToken()

    await fetch('/api/vendedores/create', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id,
        [campo]: valor,
      }),
    })

    fetchVendedores()
  }

  const eliminarVendedor = async (id: string) => {
    const confirmDelete = confirm('¿Eliminar este vendedor?')
    if (!confirmDelete) return

    const token = await getSessionToken()

    await fetch('/api/vendedores/create', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    })

    fetchVendedores()
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Gestión de Vendedores</h1>

      {/* CREAR */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Crear nuevo usuario</h2>

        <div className="flex gap-4 flex-wrap">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700"
          />

          <select
            value={rol}
            onChange={e => setRol(e.target.value)}
            className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700"
          >
            <option value="vendedor">Vendedor</option>
            <option value="admin">Admin</option>
          </select>

          <button
            onClick={crearVendedor}
            disabled={creating}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium"
          >
            {creating ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-zinc-500">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-800 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Activo</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Conversión</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {vendedores.map(v => (
                <tr
                  key={v.vendedor_id}
                  className="border-t border-zinc-800 hover:bg-zinc-800/40"
                >
                  <td className="px-4 py-3">{v.email}</td>

                  {/* ROL */}
                  <td className="px-4 py-3">
                    <select
                      value={v.rol}
                      onChange={e =>
                        actualizarVendedor(
                          v.vendedor_id,
                          'rol',
                          e.target.value
                        )
                      }
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1"
                    >
                      <option value="vendedor">Vendedor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>

                  {/* ACTIVO */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={v.activo}
                      onChange={e =>
                        actualizarVendedor(
                          v.vendedor_id,
                          'activo',
                          e.target.checked
                        )
                      }
                    />
                  </td>

                  <td className="px-4 py-3">{v.total}</td>
                  <td className="px-4 py-3 font-semibold">
                    {v.conversion}%
                  </td>

                  {/* ELIMINAR */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        eliminarVendedor(v.vendedor_id)
                      }
                      className="text-red-400 hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
