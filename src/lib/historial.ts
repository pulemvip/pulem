// /lib/historial.ts
// Función para registrar acciones en el historial

import { supabase } from '@/lib/supabase'

type AccionType =
  | 'consumo_agregado'
  | 'consumo_eliminado'
  | 'consumos_limpiados'
  | 'invitado_agregado'
  | 'invitado_eliminado'
  | 'invitados_limpiados'
  | 'reroll_ejecutado'
  | 'evento_creado'
  | 'evento_editado'
  | 'evento_eliminado'
  | 'usuario_activado'
  | 'usuario_desactivado'
  | 'lista_limpiada'
  | 'session_iniciada'

type RegistrarAccionParams = {
  accion: AccionType
  detalle?: string
  metadata?: Record<string, unknown>
}

export async function registrarAccion({ accion, detalle, metadata }: RegistrarAccionParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('email')
      .eq('id', user.id)
      .single()

    await supabase.from('historial').insert({
      user_id: user.id,
      user_email: perfil?.email ?? user.email ?? 'desconocido',
      accion,
      detalle: detalle ?? null,
      metadata: metadata ?? null,
    })
  } catch (err) {
    // No romper la app si falla el registro
    console.warn('[Historial] Error al registrar acción:', err)
  }
}

// Labels legibles para cada acción
export const ACCION_LABELS: Record<AccionType, string> = {
  consumo_agregado: 'Consumo agregado',
  consumo_eliminado: 'Consumo eliminado',
  consumos_limpiados: 'Lista de consumos limpiada',
  invitado_agregado: 'Invitado agregado',
  invitado_eliminado: 'Invitado eliminado',
  invitados_limpiados: 'Lista de invitados limpiada',
  reroll_ejecutado: 'Reroll ejecutado',
  evento_creado: 'Evento creado',
  evento_editado: 'Evento editado',
  evento_eliminado: 'Evento eliminado',
  usuario_activado: 'Usuario activado',
  usuario_desactivado: 'Usuario desactivado',
  lista_limpiada: 'Lista limpiada',
  session_iniciada: 'Entró a la app',
}

export const ACCION_COLORS: Record<AccionType, string> = {
  consumo_agregado: 'text-emerald-400',
  consumo_eliminado: 'text-red-400',
  consumos_limpiados: 'text-red-500',
  invitado_agregado: 'text-blue-400',
  invitado_eliminado: 'text-red-400',
  invitados_limpiados: 'text-red-500',
  reroll_ejecutado: 'text-purple-400',
  evento_creado: 'text-emerald-400',
  evento_editado: 'text-amber-400',
  evento_eliminado: 'text-red-400',
  usuario_activado: 'text-emerald-400',
  usuario_desactivado: 'text-red-400',
  lista_limpiada: 'text-red-500',
  session_iniciada: 'text-zinc-400',
}