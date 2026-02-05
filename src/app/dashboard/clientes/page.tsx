"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/* =======================
   Tipos
======================= */
type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
  estado: string | null;
  ultima_semana_enviada: number | null;
};

/* =======================
   Semana actual
======================= */
const getSemanaActual = (): number => {
  const hoy = new Date();
  const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1);

  const dias = Math.floor(
    (hoy.getTime() - primerDiaAnio.getTime()) / (24 * 60 * 60 * 1000)
  );

  const semana = Math.ceil((dias + primerDiaAnio.getDay() + 1) / 7);

  return Number(`${hoy.getFullYear()}${semana}`);
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mensaje, setMensaje] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string>("");

  const semanaActual = getSemanaActual();

  useEffect(() => {
    const cargarTodo = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // ✔️ user.email puede ser undefined
      setUserEmail(user.email ?? "");

      const { data: clientesData } = await supabase
        .from("clientes")
        .select("*")
        .eq("user_id", user.id)
        .order("nombre");

      setClientes((clientesData as Cliente[]) || []);

      const { data: settings } = await supabase
        .from("user_settings")
        .select("mensaje")
        .eq("user_id", user.id)
        .single();

      setMensaje(
        settings?.mensaje ??
          `Hola {{nombre}} 👋
Te escribo de PULEM VIP.
¿Te paso info de la próxima fecha? 🔥`
      );

      setLoading(false);
    };

    cargarTodo();
  }, []);

  const guardarMensaje = async (): Promise<void> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("user_settings").upsert({
      user_id: user.id,
      mensaje,
    });

    alert("Mensaje guardado");
  };

  const cerrarSesion = async (): Promise<void> => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const enviarWhatsapp = async (cliente: Cliente): Promise<void> => {
    const texto = mensaje.replace("{{nombre}}", cliente.nombre);
    const mensajeEncoded = encodeURIComponent(texto);

    window.open(
      `https://wa.me/${cliente.telefono}?text=${mensajeEncoded}`,
      "_blank"
    );

    await supabase
      .from("clientes")
      .update({
        estado: "enviado",
        ultima_semana_enviada: semanaActual,
      })
      .eq("id", cliente.id);

    setClientes((prev) =>
      prev.map((c) =>
        c.id === cliente.id
          ? {
              ...c,
              estado: "enviado",
              ultima_semana_enviada: semanaActual,
            }
          : c
      )
    );
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Cargando clientes...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-gray-500 text-sm">
            Sesión iniciada como{" "}
            <span className="font-medium text-gray-800">{userEmail}</span>
          </p>
        </div>

        <button
          onClick={cerrarSesion}
          className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Cerrar sesión
        </button>
      </div>

      {/* MENSAJE */}
      <div className="bg-white text-gray-900 rounded-xl shadow p-4 space-y-3">
        <h2 className="font-semibold">Mensaje de WhatsApp</h2>

        <textarea
          className="w-full border rounded-lg p-3 text-sm"
          rows={4}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Usá <b>{"{{nombre}}"}</b> para personalizar
          </span>

          <button
            onClick={guardarMensaje}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm"
          >
            Guardar mensaje
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-4 py-3 text-sm font-semibold bg-gray-100">
          <div>Nombre</div>
          <div>Teléfono</div>
          <div>Estado</div>
          <div className="text-right">Acción</div>
        </div>

        {clientes.map((c) => {
          const bloqueado = c.ultima_semana_enviada === semanaActual;

          return (
            <div
              key={c.id}
              className="grid grid-cols-4 gap-4 px-4 py-3 text-sm border-t items-center"
            >
              <div>{c.nombre}</div>
              <div>{c.telefono}</div>

              <div>
                {bloqueado ? (
                  <span className="px-2 py-1 rounded-full text-xs bg-gray-200">
                    Bloqueado
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs bg-yellow-100">
                    Disponible
                  </span>
                )}
              </div>

              <div className="text-right">
                <button
                  onClick={() => enviarWhatsapp(c)}
                  disabled={bloqueado}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    bloqueado
                      ? "bg-gray-200 cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  WhatsApp
                </button>
              </div>
            </div>
          );
        })}

        {clientes.length === 0 && (
          <div className="p-4 text-gray-500 text-sm">
            No hay clientes cargados
          </div>
        )}
      </div>
    </div>
  );
}
