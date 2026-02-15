import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'

const ADMIN_ID = '732b5ed0-351a-459b-926c-a30a0cf75d54'

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: userData } = await supabase.auth.getUser(token)

    if (!userData?.user || userData.user.id !== ADMIN_ID) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { error, count } = await supabase
      .from('clientes')
      .update(
        { 
          estado: 'pendiente',
          ultima_semana_enviada: null
        },
        { count: 'exact' }
      )
      .eq('estado', 'enviado')

    if (error) {
      console.error("ERROR DESBLOQUEANDO:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      totalDesbloqueados: count ?? 0
    })

  } catch (err) {
    console.error("ERROR GENERAL:", err)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
