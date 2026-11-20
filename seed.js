import { loadEnvFile } from "node:process";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

loadEnvFile(".env");

const databaseName = process.env.DB_NAME || "tsoli_crm";
if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
  throw new Error("DB_NAME solo puede contener letras, números y guiones bajos.");
}
for (const key of ["DB_HOST", "DB_USER"]) {
  if (!process.env[key]) {
    throw new Error(`Falta configurar ${key} en el entorno.`);
  }
}

const database = JSON.parse(await readFile(new URL("./data/db.json", import.meta.url), "utf8"));
const setupConnection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

await setupConnection.query(
  `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
);
await setupConnection.end();

const pool = (await import("./config/db.js")).default;

const schema = [
  `CREATE TABLE IF NOT EXISTS usuarios (
    id TINYINT UNSIGNED PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    cargo VARCHAR(120) NOT NULL,
    correo VARCHAR(254) NOT NULL,
    empresa VARCHAR(160) NOT NULL,
    telefono VARCHAR(40) NOT NULL,
    zona_horaria VARCHAR(80) NOT NULL,
    idioma VARCHAR(80) NOT NULL,
    notificaciones BOOLEAN NOT NULL
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS suscripciones (
    id TINYINT UNSIGNED PRIMARY KEY,
    plan_id VARCHAR(40) NOT NULL,
    periodo VARCHAR(20) NOT NULL,
    renovacion DATE NOT NULL,
    usuarios INT UNSIGNED NOT NULL
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS clientes (
    id INT UNSIGNED PRIMARY KEY,
    nombre VARCHAR(160) NOT NULL,
    empresa VARCHAR(180) NOT NULL,
    sector VARCHAR(120) NOT NULL,
    correo VARCHAR(254) NOT NULL,
    telefono VARCHAR(40) NOT NULL,
    estado VARCHAR(40) NOT NULL,
    valor_anual DECIMAL(14, 2) NOT NULL,
    iniciales VARCHAR(12) NOT NULL
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS cotizaciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    folio VARCHAR(40) NOT NULL UNIQUE,
    cliente_id INT UNSIGNED NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    vigencia DATE NOT NULL,
    subtotal DECIMAL(14, 2) NOT NULL,
    iva DECIMAL(14, 2) NOT NULL,
    total DECIMAL(14, 2) NOT NULL,
    estado VARCHAR(40) NOT NULL,
    probabilidad TINYINT UNSIGNED NOT NULL,
    responsable VARCHAR(120) NOT NULL,
    CONSTRAINT fk_cotizaciones_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS alertas_servidor (
    id INT UNSIGNED PRIMARY KEY,
    servicio VARCHAR(160) NOT NULL,
    severidad VARCHAR(40) NOT NULL,
    region VARCHAR(120) NOT NULL,
    hora VARCHAR(40) NOT NULL,
    mensaje TEXT NOT NULL,
    estado VARCHAR(40) NOT NULL
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS seguimientos_whatsapp (
    id INT UNSIGNED PRIMARY KEY,
    cliente_id INT UNSIGNED NOT NULL,
    contacto VARCHAR(160) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha VARCHAR(40) NOT NULL,
    proximo_paso VARCHAR(255) NOT NULL,
    estado VARCHAR(40) NOT NULL,
    CONSTRAINT fk_seguimientos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS documentos (
    id INT UNSIGNED PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(120) NOT NULL,
    cliente_id INT UNSIGNED NOT NULL,
    actualizado DATE NOT NULL,
    tamano VARCHAR(40) NOT NULL,
    estado VARCHAR(40) NOT NULL,
    CONSTRAINT fk_documentos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS tareas (
    id INT UNSIGNED PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    proyecto VARCHAR(255) NOT NULL,
    prioridad VARCHAR(40) NOT NULL,
    estado VARCHAR(40) NOT NULL,
    avance TINYINT UNSIGNED NOT NULL,
    responsable VARCHAR(120) NOT NULL,
    fecha_limite DATE NOT NULL
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS actividad_mensual (
    mes VARCHAR(20) PRIMARY KEY,
    valor INT NOT NULL
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS planes (
    id VARCHAR(40) PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT NOT NULL,
    precio_mensual DECIMAL(12, 2) NOT NULL,
    precio_anual DECIMAL(12, 2) NOT NULL,
    usuarios INT UNSIGNED NOT NULL,
    caracteristicas JSON NOT NULL
  ) ENGINE=InnoDB`
];

async function seedRows(connection, table, columns, rows) {
  if (rows.length === 0) return;
  const updates = columns
    .filter((column) => column !== "id")
    .map((column) => `\`${column}\` = VALUES(\`${column}\`)`)
    .join(", ");
  const placeholders = rows.map(() => `(${columns.map(() => "?").join(", ")})`).join(", ");
  const values = rows.flat();
  await connection.query(
    `INSERT INTO \`${table}\` (${columns.map((column) => `\`${column}\``).join(", ")}) VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE ${updates}`,
    values
  );
}

const connection = await pool.getConnection();
try {
  for (const statement of schema) {
    await connection.query(statement);
  }

  await connection.beginTransaction();
  await seedRows(connection, "usuarios", [
    "id", "nombre", "cargo", "correo", "empresa", "telefono", "zona_horaria", "idioma", "notificaciones"
  ], [[
    1, database.usuario.nombre, database.usuario.cargo, database.usuario.correo,
    database.usuario.empresa, database.usuario.telefono, database.usuario.zonaHoraria,
    database.usuario.idioma, database.usuario.notificaciones
  ]]);
  await seedRows(connection, "suscripciones", [
    "id", "plan_id", "periodo", "renovacion", "usuarios"
  ], [[
    1, database.suscripcion.planId, database.suscripcion.periodo,
    database.suscripcion.renovacion, database.suscripcion.usuarios
  ]]);

  await seedRows(connection, "clientes", [
    "id", "nombre", "empresa", "sector", "correo", "telefono", "estado", "valor_anual", "iniciales"
  ], database.clientes.map((item) => [
    item.id, item.nombre, item.empresa, item.sector, item.correo, item.telefono,
    item.estado, item.valorAnual, item.iniciales
  ]));
  await seedRows(connection, "planes", [
    "id", "nombre", "descripcion", "precio_mensual", "precio_anual", "usuarios", "caracteristicas"
  ], database.planes.map((item) => [
    item.id, item.nombre, item.descripcion, item.precioMensual, item.precioAnual,
    item.usuarios, JSON.stringify(item.caracteristicas)
  ]));
  await seedRows(connection, "cotizaciones", [
    "id", "folio", "cliente_id", "concepto", "fecha", "vigencia", "subtotal", "iva",
    "total", "estado", "probabilidad", "responsable"
  ], database.cotizaciones.map((item) => [
    item.id, item.folio, item.clienteId, item.concepto, item.fecha, item.vigencia,
    item.subtotal, item.iva, item.total, item.estado, item.probabilidad, item.responsable
  ]));
  await seedRows(connection, "alertas_servidor", [
    "id", "servicio", "severidad", "region", "hora", "mensaje", "estado"
  ], database.alertasServidor.map((item) => [
    item.id, item.servicio, item.severidad, item.region, item.hora, item.mensaje, item.estado
  ]));
  await seedRows(connection, "seguimientos_whatsapp", [
    "id", "cliente_id", "contacto", "mensaje", "fecha", "proximo_paso", "estado"
  ], database.seguimientosWhatsApp.map((item) => [
    item.id, item.clienteId, item.contacto, item.mensaje, item.fecha, item.proximoPaso, item.estado
  ]));
  await seedRows(connection, "documentos", [
    "id", "nombre", "categoria", "cliente_id", "actualizado", "tamano", "estado"
  ], database.documentos.map((item) => [
    item.id, item.nombre, item.categoria, item.clienteId, item.actualizado, item.tamano, item.estado
  ]));
  await seedRows(connection, "tareas", [
    "id", "titulo", "proyecto", "prioridad", "estado", "avance", "responsable", "fecha_limite"
  ], database.tareas.map((item) => [
    item.id, item.titulo, item.proyecto, item.prioridad, item.estado, item.avance,
    item.responsable, item.fechaLimite
  ]));
  await seedRows(connection, "actividad_mensual", ["mes", "valor"],
    database.actividadMensual.map((item) => [item.mes, item.valor]));
  await connection.commit();
  console.log(`Base de datos ${databaseName} inicializada con los datos ficticios.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
