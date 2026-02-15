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

    // 🔐 Auth check
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: userData } = await supabase.auth.getUser(token)

    if (!userData?.user || userData.user.id !== ADMIN_ID) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // 👥 Traer todos los clientes
    const { data: clientes } = await supabase
      .from('clientes')
      .select('user_id, estado')

    if (!clientes) {
      return NextResponse.json([])
    }

    // 📊 Agrupar por vendedor
    const vendedoresStats: Record<
      string,
      { total: number; enviados: number; pendientes: number }
    > = {}

    for (const cliente of clientes) {
      if (!vendedoresStats[cliente.user_id]) {
        vendedoresStats[cliente.user_id] = {
          total: 0,
          enviados: 0,
          pendientes: 0,
        }
      }

      vendedoresStats[cliente.user_id].total++

      if (cliente.estado === 'enviado') {
        vendedoresStats[cliente.user_id].enviados++
      } else {
        vendedoresStats[cliente.user_id].pendientes++
      }
    }

    // 🔍 Obtener emails
    const resultado = []

    for (const vendedorId of Object.keys(vendedoresStats)) {
      const { data } = await supabase.auth.admin.getUserById(vendedorId)

      const stats = vendedoresStats[vendedorId]

      resultado.push({
        vendedor_id: vendedorId,
        email: data.user?.email || 'Sin email',
        total: stats.total,
        enviados: stats.enviados,
        pendientes: stats.pendientes,
        conversion:
          stats.total > 0
            ? Math.round((stats.enviados / stats.total) * 100)
            : 0,
      })
    }

    return NextResponse.json(resultado)
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
