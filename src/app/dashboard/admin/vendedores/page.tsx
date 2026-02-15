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
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const fetchVendedores = async () => {
    setLoading(true)
    const token = await getSessionToken()
    const res = await fetch('/api/vendedores', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setVendedores(data || [])
    setLoading(false)
  }

  const crearVendedor = async () => {
    setCreating(true)
    const token = await getSessionToken()
    const res = await fetch('/api/vendedores', {
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
    } else alert(data.error)
    setCreating(false)
  }

  const actualizarVendedor = async (id: string, campo: string, valor: any) => {
    const token = await getSessionToken()
    await fetch('/api/vendedores', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, [campo]: valor }),
    })
    fetchVendedores()
  }

  const eliminarVendedor = async (id: string) => {
    if (!confirm('¿Eliminar este vendedor?')) return
    const token = await getSessionToken()
    await fetch('/api/vendedores', {
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
    <div className="space-y-10 px-4 md:px-10 py-6">
      <h1 className="text-3xl font-bold">Gestión de Vendedores</h1>

      {/* CREAR USUARIO */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-end md:gap-4 gap-3 flex-wrap">
        <div className="flex flex-col flex-1">
          <label className="text-sm text-zinc-400 mb-1">Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 w-full"
          />
        </div>

        <div className="flex flex-col flex-1">
          <label className="text-sm text-zinc-400 mb-1">Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 w-full"
          />
        </div>

        <div className="flex flex-col flex-1">
          <label className="text-sm text-zinc-400 mb-1">Rol</label>
          <select
            value={rol}
            onChange={e => setRol(e.target.value)}
            className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 w-full"
          >
            <option value="vendedor">Vendedor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          onClick={crearVendedor}
          disabled={creating}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium min-w-[120px] mt-2 md:mt-0"
        >
          {creating ? 'Creando...' : 'Crear'}
        </button>
      </div>

      {/* TABLA DE VENDEDORES */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
        {loading ? (
          <div className="p-6 text-zinc-500">Cargando...</div>
        ) : (
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-zinc-800 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Activo</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Enviados</th>
                <th className="px-4 py-3 text-left">Pendientes</th>
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
                      value={v.rol === 'admin' ? 'admin' : 'vendedor'}
                      onChange={e =>
                        actualizarVendedor(v.vendedor_id, 'rol', e.target.value)
                      }
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 w-full"
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
                        actualizarVendedor(v.vendedor_id, 'activo', e.target.checked)
                      }
                    />
                  </td>

                  <td className="px-4 py-3">{v.total}</td>
                  <td className="px-4 py-3">{v.enviados}</td>
                  <td className="px-4 py-3">{v.pendientes}</td>
                  <td className="px-4 py-3 font-semibold">{v.conversion}%</td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => eliminarVendedor(v.vendedor_id)}
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
