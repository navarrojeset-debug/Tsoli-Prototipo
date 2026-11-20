import pool from "../config/db.js";

export async function readDatabase() {
  const [
    [users],
    [subscriptions],
    [clientes],
    [cotizaciones],
    [alertasServidor],
    [seguimientosWhatsApp],
    [documentos],
    [tareas],
    [actividadMensual],
    [planes]
  ] = await Promise.all([
    pool.query(`SELECT nombre, cargo, correo, empresa, telefono, zona_horaria AS zonaHoraria,
      idioma, notificaciones FROM usuarios WHERE id = 1`),
    pool.query(`SELECT plan_id AS planId, periodo, renovacion, usuarios FROM suscripciones WHERE id = 1`),
    pool.query(`SELECT id, nombre, empresa, sector, correo, telefono, estado,
      valor_anual AS valorAnual, iniciales FROM clientes ORDER BY id`),
    pool.query(`SELECT id, folio, cliente_id AS clienteId, concepto, fecha, vigencia, subtotal, iva,
      total, estado, probabilidad, responsable FROM cotizaciones ORDER BY fecha DESC, id DESC`),
    pool.query(`SELECT id, servicio, severidad, region, hora, mensaje, estado FROM alertas_servidor ORDER BY id`),
    pool.query(`SELECT id, cliente_id AS clienteId, contacto, mensaje, fecha,
      proximo_paso AS proximoPaso, estado FROM seguimientos_whatsapp ORDER BY id`),
    pool.query(`SELECT id, nombre, categoria, cliente_id AS clienteId, actualizado, tamano, estado
      FROM documentos ORDER BY id`),
    pool.query(`SELECT id, titulo, proyecto, prioridad, estado, avance, responsable,
      fecha_limite AS fechaLimite FROM tareas ORDER BY id`),
    pool.query("SELECT mes, valor FROM actividad_mensual ORDER BY FIELD(mes, 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov')"),
    pool.query(`SELECT id, nombre, descripcion, precio_mensual AS precioMensual,
      precio_anual AS precioAnual, usuarios, caracteristicas FROM planes ORDER BY FIELD(id, 'starter', 'pro', 'enterprise')`)
  ]);

  if (!users[0] || !subscriptions[0]) {
    throw new Error("Faltan los registros iniciales de usuario o suscripción en MySQL. Ejecuta node seed.js.");
  }

  return {
    usuario: { ...users[0], notificaciones: Boolean(users[0].notificaciones) },
    suscripcion: subscriptions[0],
    clientes,
    cotizaciones,
    alertasServidor,
    seguimientosWhatsApp,
    documentos,
    tareas,
    actividadMensual,
    planes: planes.map((plan) => ({
      ...plan,
      caracteristicas: typeof plan.caracteristicas === "string"
        ? JSON.parse(plan.caracteristicas)
        : plan.caracteristicas
    }))
  };
}
