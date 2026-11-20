function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] ?? "Sin estado";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

export function sanitizeUserMessage(message) {
  return message
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[correo omitido]")
    .replace(/(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,3}\)|\d{2,3})[\s.-]?\d{3,4}[\s.-]?\d{4}\b/g, "[teléfono omitido]");
}

export function buildBusinessContext(database) {
  const clientReferences = new Map(
    database.clientes.map((client, index) => [client.id, `Cuenta ${index + 1}`])
  );

  return {
    resumen: {
      clientes: database.clientes.length,
      cotizaciones: database.cotizaciones.length,
      alertasServidor: database.alertasServidor.length,
      seguimientosWhatsApp: database.seguimientosWhatsApp.length
    },
    clientes: {
      porEstado: countBy(database.clientes, "estado"),
      porSector: countBy(database.clientes, "sector"),
      registros: database.clientes.map((client, index) => ({
        referencia: `Cuenta ${index + 1}`,
        sector: client.sector,
        estado: client.estado
      }))
    },
    cotizaciones: {
      porEstado: countBy(database.cotizaciones, "estado"),
      registros: database.cotizaciones.map((quote) => ({
        folio: quote.folio,
        cliente: clientReferences.get(quote.clienteId) ?? "Cuenta no disponible",
        fecha: quote.fecha,
        vigencia: quote.vigencia,
        estado: quote.estado,
        probabilidad: quote.probabilidad
      }))
    },
    alertasServidor: {
      porEstado: countBy(database.alertasServidor, "estado"),
      porSeveridad: countBy(database.alertasServidor, "severidad"),
      registros: database.alertasServidor.map((alert, index) => ({
        referencia: `Alerta ${index + 1}`,
        severidad: alert.severidad,
        estado: alert.estado
      }))
    },
    seguimientosWhatsApp: {
      porEstado: countBy(database.seguimientosWhatsApp, "estado"),
      registros: database.seguimientosWhatsApp.map((followup) => ({
        cliente: clientReferences.get(followup.clienteId) ?? "Cuenta no disponible",
        fecha: followup.fecha.slice(0, 10),
        estado: followup.estado
      }))
    }
  };
}
