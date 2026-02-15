// /app/api/vendedores/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function createSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// 🔐 Valida que sea admin y devuelve supabase client
async function validarAdmin(req: Request) {
  const supabase = createSupabase()

  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const { data: userData } = await supabase.auth.getUser(token)
  if (!userData?.user) return null

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', userData.user.id)
    .single()

  if (!perfil || perfil.rol !== 'admin') return null
  return supabase
}

// ---------------------------------
// GET → Listar vendedores + stats
// ---------------------------------
export async function GET(req: Request) {
  try {
    const supabase = await validarAdmin(req)
    if (!supabase)
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    // Traer todos los usuarios (vendedores)
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('*')
    if (!usuarios) return NextResponse.json([])

    // Traer todos los clientes
    const { data: clientes } = await supabase
      .from('clientes')
      .select('user_id, estado')

    // Stats por vendedor
    const stats: Record<
      string,
      { total: number; enviados: number; pendientes: number }
    > = {}

    clientes?.forEach(c => {
      if (!stats[c.user_id]) stats[c.user_id] = { total: 0, enviados: 0, pendientes: 0 }
      stats[c.user_id].total++
      if (c.estado === 'enviado') stats[c.user_id].enviados++
      else stats[c.user_id].pendientes++
    })

    const resultado = usuarios.map(u => {
      const vendedorStats = stats[u.id] || { total: 0, enviados: 0, pendientes: 0 }
      return {
        vendedor_id: u.id,
        email: u.email,
        rol: u.rol || 'vendedor',
        activo: u.activo ?? true,
        total: vendedorStats.total,
        enviados: vendedorStats.enviados,
        pendientes: vendedorStats.pendientes,
        conversion:
          vendedorStats.total > 0
            ? Math.round((vendedorStats.enviados / vendedorStats.total) * 100)
            : 0,
      }
    })

    return NextResponse.json(resultado)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ---------------------------------
// POST → Crear vendedor
// ---------------------------------
export async function POST(req: Request) {
  try {
    const supabase = await validarAdmin(req)
    if (!supabase)
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const { email, password, rol } = await req.json()

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error || !data.user)
      return NextResponse.json({ error: error?.message || 'Error al crear usuario' }, { status: 400 })

    await supabase.from('usuarios').insert({
      id: data.user.id,
      email: data.user.email,
      rol: rol || 'vendedor',
      activo: true,
    })

    return NextResponse.json({ message: 'Usuario creado' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ---------------------------------
// PATCH → Actualizar rol o activo
// ---------------------------------
export async function PATCH(req: Request) {
  try {
    const supabase = await validarAdmin(req)
    if (!supabase)
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const { id, rol, activo } = await req.json()
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    await supabase
      .from('usuarios')
      .update({
        ...(rol !== undefined && { rol }),
        ...(activo !== undefined && { activo }),
      })
      .eq('id', id)

    return NextResponse.json({ message: 'Actualizado' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ---------------------------------
// DELETE → Eliminar vendedor
// ---------------------------------
export async function DELETE(req: Request) {
  try {
    const supabase = await validarAdmin(req)
    if (!supabase)
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    await supabase.auth.admin.deleteUser(id)
    await supabase.from('usuarios').delete().eq('id', id)

    return NextResponse.json({ message: 'Eliminado' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
