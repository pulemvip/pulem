import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const ADMIN_ID = '732b5ed0-351a-459b-926c-a30a0cf75d54'

export async function GET(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 🔐 AUTH
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: userData } = await supabase.auth.getUser(token)

    if (!userData?.user || userData.user.id !== ADMIN_ID) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // 👤 CLIENTES
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, nombre, estado, user_id')
      .order('nombre')

    if (!clientes) {
      return NextResponse.json([])
    }

    // 👥 VENDEDORES ÚNICOS
    const vendedoresIds = [...new Set(clientes.map(c => c.user_id))]

    const vendedoresMap = new Map<string, string>()

    for (const vendedorId of vendedoresIds) {
      const { data } = await supabase.auth.admin.getUserById(vendedorId)

      vendedoresMap.set(
  vendedorId,
  data.user?.email || 'Sin email'
)
    }

    const resultado = clientes.map(c => ({
      ...c,
      vendedor_nombre: vendedoresMap.get(c.user_id) || 'Desconocido'
    }))

    return NextResponse.json(resultado)

  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
