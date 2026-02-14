'use client'

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración del Panel</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div>
          <p className="text-sm text-zinc-500">API Key Supabase</p>
          <input
            type="text"
            placeholder="*****"
            className="mt-1 w-full p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100"
          />
        </div>

        <div>
          <p className="text-sm text-zinc-500">Opciones Generales</p>
          <label className="flex items-center gap-2 mt-2">
            <input type="checkbox" className="accent-blue-500" /> Habilitar notificaciones
          </label>
          <label className="flex items-center gap-2 mt-2">
            <input type="checkbox" className="accent-blue-500" /> Modo mantenimiento
          </label>
        </div>

        <button className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition font-medium mt-4">
          Guardar configuración
        </button>
      </div>
    </div>
  )
}
