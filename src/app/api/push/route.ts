import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { title, body, url } = await req.json()

    if (!title || !body) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    // ==========================
    // 🔐 AUTH — identificar quién envía
    // ==========================
    const authHeader = req.headers.get('authorization')
    let user_id: string | null = null
    let rol: string = 'vendedor'

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: userData } = await supabase.auth.getUser(token)
      if (userData?.user) {
        user_id = userData.user.id
        const { data: perfil } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('id', user_id)
          .single()
        rol = perfil?.rol ?? 'vendedor'
      }
    }

    // Solo admin y jefe pueden enviar notificaciones
    if (!user_id || !['admin', 'jefe'].includes(rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // ==========================
    // 📋 SUSCRIPCIONES — filtrar según rol
    // ==========================
    let userIds: string[] | null = null

    if (rol === 'jefe') {
      // Jefe solo notifica a sus vendedores
      const { data: misVendedores } = await supabase
        .from('usuarios')
        .select('id')
        .eq('creado_por', user_id)
        .eq('rol', 'vendedor')
        .eq('activo', true)

      if (!misVendedores || misVendedores.length === 0) {
        return NextResponse.json({ message: 'No tenés vendedores activos', enviados: 0, fallidos: 0 })
      }

      userIds = misVendedores.map(v => v.id)
    }

    // Traer suscripciones — admin trae todas, jefe filtra por sus vendedores
    const subsQuery = supabase.from('push_subscriptions').select('subscription, user_id')
    const { data: subs, error } = userIds
      ? await subsQuery.in('user_id', userIds)
      : await subsQuery

    if (error) throw error
    if (!subs || subs.length === 0) {
      return NextResponse.json({ message: 'Sin suscriptores', enviados: 0, fallidos: 0 })
    }

    const payload = JSON.stringify({ title, body, url: url || '/dashboard/user/clientes' })

    // ==========================
    // 🚀 ENVIAR
    // ==========================
    const results = await Promise.allSettled(
      subs.map(({ subscription }) =>
        webpush.sendNotification(subscription, payload)
      )
    )

    const enviados = results.filter(r => r.status === 'fulfilled').length
    const fallidos = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({ enviados, fallidos })
  } catch (err) {
    console.error('Push error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}