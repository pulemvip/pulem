import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function createSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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

//
// GET → listar vendedores
//
export async function GET(req: Request) {
  const supabase = await validarAdmin(req)
  if (!supabase)
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('*')

  const { data: clientes } = await supabase
    .from('clientes')
    .select('user_id, estado')

  const stats: any = {}

  clientes?.forEach(c => {
    if (!stats[c.user_id]) {
      stats[c.user_id] = { total: 0, enviados: 0 }
    }

    stats[c.user_id].total++
    if (c.estado === 'enviado') stats[c.user_id].enviados++
  })

  const resultado = usuarios?.map(u => {
    const vendedorStats = stats[u.id] || { total: 0, enviados: 0 }

    return {
      vendedor_id: u.id,
      email: u.email,
      rol: u.rol,
      activo: u.activo,
      total: vendedorStats.total,
      conversion:
        vendedorStats.total > 0
          ? Math.round(
              (vendedorStats.enviados / vendedorStats.total) * 100
            )
          : 0,
    }
  })

  return NextResponse.json(resultado)
}

//
// POST → crear vendedor
//
export async function POST(req: Request) {
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
    return NextResponse.json({ error: error?.message }, { status: 400 })

  await supabase.from('usuarios').insert({
    id: data.user.id,
    email: data.user.email,
    rol: rol || 'vendedor',
    activo: true,
  })

  return NextResponse.json({ message: 'Usuario creado' })
}

//
// PATCH → actualizar rol o activo
//
export async function PATCH(req: Request) {
  const supabase = await validarAdmin(req)
  if (!supabase)
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id, rol, activo } = await req.json()

  await supabase
    .from('usuarios')
    .update({
      ...(rol !== undefined && { rol }),
      ...(activo !== undefined && { activo }),
    })
    .eq('id', id)

  return NextResponse.json({ message: 'Actualizado' })
}

//
// DELETE → eliminar vendedor
//
export async function DELETE(req: Request) {
  const supabase = await validarAdmin(req)
  if (!supabase)
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await req.json()

  await supabase.auth.admin.deleteUser(id)

  return NextResponse.json({ message: 'Eliminado' })
}
