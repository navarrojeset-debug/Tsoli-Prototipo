const schema = `Diccionario de datos de la base de datos tsoli_crm

usuarios
- id TINYINT UNSIGNED NOT NULL — PK
- nombre VARCHAR(120) NOT NULL
- cargo VARCHAR(120) NOT NULL
- correo VARCHAR(254) NOT NULL
- empresa VARCHAR(160) NOT NULL
- telefono VARCHAR(40) NOT NULL
- zona_horaria VARCHAR(80) NOT NULL
- idioma VARCHAR(80) NOT NULL
- notificaciones BOOLEAN NOT NULL

suscripciones
- id TINYINT UNSIGNED NOT NULL — PK
- plan_id VARCHAR(40) NOT NULL
- periodo VARCHAR(20) NOT NULL
- renovacion DATE NOT NULL
- usuarios INT UNSIGNED NOT NULL

clientes
- id INT UNSIGNED NOT NULL — PK
- nombre VARCHAR(160) NOT NULL
- empresa VARCHAR(180) NOT NULL
- sector VARCHAR(120) NOT NULL
- correo VARCHAR(254) NOT NULL
- telefono VARCHAR(40) NOT NULL
- estado VARCHAR(40) NOT NULL
- valor_anual DECIMAL(14, 2) NOT NULL
- iniciales VARCHAR(12) NOT NULL

cotizaciones
- id INT UNSIGNED NOT NULL AUTO_INCREMENT — PK
- folio VARCHAR(40) NOT NULL — UNIQUE
- cliente_id INT UNSIGNED NOT NULL — FK a clientes.id
- concepto VARCHAR(255) NOT NULL
- fecha DATE NOT NULL
- vigencia DATE NOT NULL
- subtotal DECIMAL(14, 2) NOT NULL
- iva DECIMAL(14, 2) NOT NULL
- total DECIMAL(14, 2) NOT NULL
- estado VARCHAR(40) NOT NULL
- probabilidad TINYINT UNSIGNED NOT NULL
- responsable VARCHAR(120) NOT NULL

alertas_servidor
- id INT UNSIGNED NOT NULL — PK
- servicio VARCHAR(160) NOT NULL
- severidad VARCHAR(40) NOT NULL
- region VARCHAR(120) NOT NULL
- hora VARCHAR(40) NOT NULL
- mensaje TEXT NOT NULL
- estado VARCHAR(40) NOT NULL

seguimientos_whatsapp
- id INT UNSIGNED NOT NULL — PK
- cliente_id INT UNSIGNED NOT NULL — FK a clientes.id
- contacto VARCHAR(160) NOT NULL
- mensaje TEXT NOT NULL
- fecha VARCHAR(40) NOT NULL
- proximo_paso VARCHAR(255) NOT NULL
- estado VARCHAR(40) NOT NULL

documentos
- id INT UNSIGNED NOT NULL — PK
- nombre VARCHAR(255) NOT NULL
- categoria VARCHAR(120) NOT NULL
- cliente_id INT UNSIGNED NOT NULL — FK a clientes.id
- actualizado DATE NOT NULL
- tamano VARCHAR(40) NOT NULL
- estado VARCHAR(40) NOT NULL

tareas
- id INT UNSIGNED NOT NULL — PK
- titulo VARCHAR(255) NOT NULL
- proyecto VARCHAR(255) NOT NULL
- prioridad VARCHAR(40) NOT NULL
- estado VARCHAR(40) NOT NULL
- avance TINYINT UNSIGNED NOT NULL
- responsable VARCHAR(120) NOT NULL
- fecha_limite DATE NOT NULL

actividad_mensual
- mes VARCHAR(20) NOT NULL — PK
- valor INT NOT NULL

planes
- id VARCHAR(40) NOT NULL — PK
- nombre VARCHAR(120) NOT NULL
- descripcion TEXT NOT NULL
- precio_mensual DECIMAL(12, 2) NOT NULL
- precio_anual DECIMAL(12, 2) NOT NULL
- usuarios INT UNSIGNED NOT NULL
- caracteristicas JSON NOT NULL

Relaciones foráneas
- fk_cotizaciones_cliente: cotizaciones.cliente_id -> clientes.id
- fk_seguimientos_cliente: seguimientos_whatsapp.cliente_id -> clientes.id
- fk_documentos_cliente: documentos.cliente_id -> clientes.id`;

export default schema;
