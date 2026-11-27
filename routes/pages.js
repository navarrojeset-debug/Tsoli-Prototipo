import { Router } from "express";
import pool from "../config/db.js";
import { readDatabase } from "../data/store.js";

const router = Router();

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function withClientNames(database) {
  const clientsById = new Map(database.clientes.map((client) => [client.id, client.nombre]));
  return {
    cotizaciones: database.cotizaciones.map((quote) => ({
      ...quote,
      clienteNombre: clientsById.get(quote.clienteId) ?? "Cliente no disponible"
    })),
    documentos: database.documentos.map((document) => ({
      ...document,
      clienteNombre: clientsById.get(document.clienteId) ?? "Cliente no disponible"
    })),
    seguimientos: database.seguimientosWhatsApp.map((followup) => ({
      ...followup,
      clienteNombre: clientsById.get(followup.clienteId) ?? "Cliente no disponible"
    }))
  };
}

router.get("/", (req, res) => res.redirect("/dashboard"));

router.get(
  "/base-datos",
  asyncHandler(async (req, res) => {
    const [tableRows] = await pool.query(
      `SELECT TABLE_NAME AS tableName
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`
    );
    const tables = await Promise.all(tableRows.map(async ({ tableName }) => {
      const escapedName = tableName.replace(/`/g, "``");
      const [records, fields] = await pool.query(`SELECT * FROM \`${escapedName}\``);
      return {
        name: tableName,
        label: tableName.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toLocaleUpperCase("es-MX")),
        columns: fields.map(({ name }) => name),
        records
      };
    }));
    const user = tables.find((table) => table.name === "usuarios")?.records[0];

    res.set("Cache-Control", "no-store");
    res.render("base-datos", {
      activePage: "base-datos",
      database: { usuario: { nombre: user?.nombre || "Equipo Tsoli" } },
      tables,
      recordCount: tables.reduce((total, table) => total + table.records.length, 0)
    });
  })
);

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const database = await readDatabase();
    const related = withClientNames(database);
    const activeQuotes = related.cotizaciones.filter(
      (quote) => !["Aprobada", "Rechazada"].includes(quote.estado)
    );
    const activeAlerts = database.alertasServidor.filter((alert) => alert.estado === "Activa");
    const openFollowups = related.seguimientos.filter(
      (followup) => followup.estado !== "Completado"
    );
    const activeTasks = database.tareas.filter((task) => task.estado !== "Completada");

    res.render("dashboard", {
      database,
      activePage: "dashboard",
      quotes: related.cotizaciones,
      followups: related.seguimientos,
      metrics: {
        clients: database.clientes.filter((client) => client.estado === "Activo").length,
        pipeline: activeQuotes.reduce((total, quote) => total + quote.total, 0),
        followups: openFollowups.length,
        alerts: activeAlerts.length,
        tasks: activeTasks.length
      },
      activeAlerts
    });
  })
);

router.get(
  "/copiloto",
  asyncHandler(async (req, res) => {
    const database = await readDatabase();
    const related = withClientNames(database);
    const pipeline = related.cotizaciones
      .filter((quote) => !["Aprobada", "Rechazada"].includes(quote.estado))
      .reduce((total, quote) => total + quote.total, 0);

    res.render("copiloto", {
      database,
      activePage: "copiloto",
      context: {
        clients: database.clientes.length,
        quoteCount: related.cotizaciones.length,
        pipeline
      }
    });
  })
);

router.get(
  "/proyectos",
  asyncHandler(async (req, res) => {
    const database = await readDatabase();
    const related = withClientNames(database);

    res.render("proyectos", {
      database,
      activePage: "proyectos",
      quotes: related.cotizaciones,
      followups: related.seguimientos,
      success: req.query.actualizado || req.query.cotizacion || null
    });
  })
);

router.get(
  "/documentos",
  asyncHandler(async (req, res) => {
    const database = await readDatabase();
    const related = withClientNames(database);

    res.render("documentos", {
      database,
      activePage: "documentos",
      documents: related.documentos
    });
  })
);

router.get(
  "/configuracion",
  asyncHandler(async (req, res) => {
    const database = await readDatabase();

    res.render("configuracion", {
      database,
      activePage: "configuracion",
      saved: req.query.guardado === "1"
    });
  })
);

router.get(
  "/planes",
  asyncHandler(async (req, res) => {
    const database = await readDatabase();

    res.render("planes", {
      database,
      activePage: "planes",
      saved: req.query.actualizado === "1"
    });
  })
);

export default router;
