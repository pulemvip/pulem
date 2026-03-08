import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function createSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type Perfil = { id: string; rol: string }

// Valida admin o jefe — devuelve { supabase, perfil } o null
async function validarAcceso(req: Request): Promise<{ supabase: ReturnType<typeof createSupabase>; perfil: Perfil } | null> {
  const supabase = createSupabase()

  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const { data: userData } = await supabase.auth.getUser(token)
  if (!userData?.user) return null

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id, rol')
    .eq('id', userData.user.id)
    .single()

  if (!perfil || !['admin', 'jefe'].includes(perfil.rol)) return null

  return { supabase, perfil }
}

// ---------------------------------
// GET → Listar usuarios + stats
// Admin: ve todos
// Jefe: ve solo los que creó él
// ---------------------------------
export async function GET(req: Request) {
  try {
    const acceso = await validarAcceso(req)
    if (!acceso) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const { supabase, perfil } = acceso

    const usuariosQuery = supabase.from('usuarios').select('*')

    // Jefe solo ve los vendedores que él creó
    const { data: usuarios } = perfil.rol === 'jefe'
      ? await usuariosQuery.eq('creado_por', perfil.id).eq('rol', 'vendedor')
      : await usuariosQuery

    if (!usuarios) return NextResponse.json([])

    const { data: clientes } = await supabase
      .from('clientes')
      .select('user_id, estado')

    const stats: Record<string, { total: number; enviados: number; pendientes: number }> = {}
    clientes?.forEach(c => {
      if (!c.user_id) return
      if (!stats[c.user_id]) stats[c.user_id] = { total: 0, enviados: 0, pendientes: 0 }
      stats[c.user_id].total++
      if (c.estado === 'enviado') stats[c.user_id].enviados++
      else stats[c.user_id].pendientes++
    })

    const resultado = usuarios.map(u => {
      const s = stats[u.id] || { total: 0, enviados: 0, pendientes: 0 }
      return {
        vendedor_id: u.id,
        email: u.email,
        rol: u.rol || 'vendedor',
        activo: u.activo ?? true,
        creado_por: u.creado_por ?? null,
        total: s.total,
        enviados: s.enviados,
        pendientes: s.pendientes,
        conversion: s.total > 0 ? Math.round((s.enviados / s.total) * 100) : 0,
      }
    })

    return NextResponse.json(resultado)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ---------------------------------
// POST → Crear usuario
// Admin: puede crear vendedor, jefe, admin
// Jefe: solo puede crear vendedor
// ---------------------------------
export async function POST(req: Request) {
  try {
    const acceso = await validarAcceso(req)
    if (!acceso) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const { supabase, perfil } = acceso
    const { email, password, rol } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
    }

    // Jefe solo puede crear vendedores
    const rolFinal = rol || 'vendedor'
    if (perfil.rol === 'jefe' && rolFinal !== 'vendedor') {
      return NextResponse.json({ error: 'Solo podés crear vendedores' }, { status: 403 })
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'Error al crear usuario' }, { status: 400 })
    }

    await supabase.from('usuarios').insert({
      id: data.user.id,
      email: data.user.email,
      rol: rolFinal,
      activo: true,
      creado_por: perfil.id,
    })

    return NextResponse.json({ message: 'Usuario creado', id: data.user.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ---------------------------------
// PATCH → Actualizar rol o activo
// Jefe: solo puede modificar vendedores que creó él
// ---------------------------------
export async function PATCH(req: Request) {
  try {
    const acceso = await validarAcceso(req)
    if (!acceso) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const { supabase, perfil } = acceso
    const { id, rol, activo } = await req.json()

    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    // Jefe solo puede modificar vendedores que él creó
    if (perfil.rol === 'jefe') {
      const { data: target } = await supabase
        .from('usuarios').select('creado_por, rol').eq('id', id).single()

      if (!target || target.creado_por !== perfil.id || target.rol !== 'vendedor') {
        return NextResponse.json({ error: 'Sin permisos sobre este usuario' }, { status: 403 })
      }

      // Jefe no puede cambiar el rol
      if (rol !== undefined && rol !== 'vendedor') {
        return NextResponse.json({ error: 'No podés cambiar el rol' }, { status: 403 })
      }
    }

    await supabase.from('usuarios')
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
// DELETE → Eliminar usuario
// Jefe: solo puede eliminar vendedores que creó él
// ---------------------------------
export async function DELETE(req: Request) {
  try {
    const acceso = await validarAcceso(req)
    if (!acceso) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const { supabase, perfil } = acceso
    const { id } = await req.json()

    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    // Jefe solo puede eliminar vendedores que él creó
    if (perfil.rol === 'jefe') {
      const { data: target } = await supabase
        .from('usuarios').select('creado_por, rol').eq('id', id).single()

      if (!target || target.creado_por !== perfil.id || target.rol !== 'vendedor') {
        return NextResponse.json({ error: 'Sin permisos sobre este usuario' }, { status: 403 })
      }
    }

    await supabase.auth.admin.deleteUser(id)
    await supabase.from('usuarios').delete().eq('id', id)

    return NextResponse.json({ message: 'Eliminado' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}