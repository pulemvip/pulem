"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
  estado: string | null;
  ultima_semana_enviada: number | null;
};

type Invitado = {
  id: number;
  nombre: string;
  user_id: string;
  user_email: string;
};

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
  const [userIdActual, setUserIdActual] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [tabActual, setTabActual] = useState<"clientes" | "invitados">("clientes");

  // Invitados
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [nuevoInvitado, setNuevoInvitado] = useState<string>("");

  const semanaActual = getSemanaActual();

  useEffect(() => {
    const cargarTodo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserEmail(user.email ?? "");
      setUserIdActual(user.id);

      // Clientes
      const { data: clientesData } = await supabase
        .from("clientes")
        .select("*")
        .eq("user_id", user.id)
        .order("nombre");
      setClientes((clientesData as Cliente[]) || []);

      // Mensaje
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

      // Invitados
      await cargarInvitados();

      setLoading(false);
    };

    cargarTodo();
  }, []);

  const guardarMensaje = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_settings").upsert({
      user_id: user.id,
      mensaje,
    });

    alert("Mensaje guardado");
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const enviarWhatsapp = async (cliente: Cliente) => {
    const texto = mensaje.replace("{{nombre}}", cliente.nombre);
    const mensajeEncoded = encodeURIComponent(texto);

    window.open(`https://wa.me/${cliente.telefono}?text=${mensajeEncoded}`, "_blank");

    await supabase
      .from("clientes")
      .update({ estado: "enviado", ultima_semana_enviada: semanaActual })
      .eq("id", cliente.id);

    setClientes((prev) =>
      prev.map((c) =>
        c.id === cliente.id
          ? { ...c, estado: "enviado", ultima_semana_enviada: semanaActual }
          : c
      )
    );
  };

  const cargarInvitados = async () => {
    const { data } = await supabase.from("invitados").select("*").order("nombre");
    setInvitados((data as Invitado[]) || []);
  };

  const agregarInvitado = async () => {
    if (!nuevoInvitado.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("invitados").insert({
      nombre: nuevoInvitado,
      user_id: user.id,
      user_email: user.email,
    });

    setNuevoInvitado("");
    cargarInvitados();
  };

  const eliminarInvitado = async (id: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("invitados").delete().eq("id", id).eq("user_id", user.id);
    setInvitados(prev => prev.filter(inv => inv.id !== id));
  };

  if (loading)
    return <div className="p-6 text-gray-500">Cargando clientes...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-black rounded-full"></div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Antes teniamos menos
            </h1>
          </div>

          {/* Topbar de tabs */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setTabActual("clientes")}
              className={`px-3 py-1 rounded-lg font-semibold ${
                tabActual === "clientes" ? "bg-black text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              Clientes
            </button>

            <button
              onClick={() => setTabActual("invitados")}
              className={`px-3 py-1 rounded-lg font-semibold ${
                tabActual === "invitados" ? "bg-black text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              Invitados
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A9 9 0 1118.879 6.196 9 9 0 015.12 17.804z"
              />
            </svg>
            {userEmail}
          </span>

          <button
            onClick={cerrarSesion}
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* MENSAJE */}
      {tabActual === "clientes" && (
        <div className="bg-white text-gray-900 rounded-xl shadow p-4 space-y-3">
          <h2 className="font-semibold">Mensaje de WhatsApp</h2>

          <textarea
            className="w-full border rounded-lg p-3 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
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
              className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:opacity-90"
            >
              Guardar mensaje
            </button>
          </div>
        </div>
      )}

      {/* TABLA CLIENTES */}
      {tabActual === "clientes" && (
        <div className="bg-white text-gray-900 rounded-xl shadow overflow-hidden">
          <div className="grid grid-cols-4 gap-4 px-4 py-3 text-sm font-semibold bg-gray-100 text-gray-700 items-center">
            <div>Nombre</div>
            <div>Teléfono</div>
            <div className="flex items-center gap-2">
              Estado
              <select
                className="border rounded px-1 py-0.5 text-xs"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="disponible">Disponible</option>
                <option value="bloqueado">Bloqueado</option>
              </select>
            </div>
            <div className="text-right">Acción</div>
          </div>

          {clientes
            .filter((c) => {
              const bloqueado = c.ultima_semana_enviada === semanaActual;
              const estadoCliente = bloqueado ? "bloqueado" : "disponible";
              if (filtroEstado === "todos") return true;
              return estadoCliente === filtroEstado;
            })
            .map((c) => {
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
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-600">
                        Bloqueado
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
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
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
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
      )}

      {/* TABLA INVITADOS */}
      {tabActual === "invitados" && (
        <div className="bg-white text-gray-900 rounded-xl shadow p-4 space-y-4">
          <h2 className="font-semibold text-lg">Lista de Invitados</h2>

          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg p-2"
              placeholder="Nombre del invitado"
              value={nuevoInvitado}
              onChange={(e) => setNuevoInvitado(e.target.value)}
            />
            <button
              onClick={agregarInvitado}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Agregar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm font-semibold bg-gray-100 p-2 rounded">
            <div>Nombre</div>
            <div>Vendedor</div>
          </div>

          {invitados.map((i) => (
            <div
              key={i.id}
              className="grid grid-cols-2 gap-4 px-2 py-1 border-b text-sm items-center"
            >
              <div>{i.nombre}</div>
              <div className="flex justify-between items-center">
                <span>{i.user_email}</span>
                {i.user_id === userIdActual && (
                  <button
                    onClick={() => eliminarInvitado(i.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}

          {invitados.length === 0 && (
            <p className="text-gray-500 text-sm p-2">No hay invitados agregados</p>
          )}
        </div>
      )}
    </div>
  );
}
