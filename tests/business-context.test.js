import assert from "node:assert/strict";
import test from "node:test";
import { buildBusinessContext, sanitizeUserMessage } from "../data/business-context.js";

test("business context includes current summaries without sensitive record fields", () => {
  const context = buildBusinessContext({
    clientes: [
      {
        id: 8,
        nombre: "Persona Confidencial",
        empresa: "Empresa Reservada",
        correo: "persona@ejemplo.mx",
        telefono: "+52 55 1234 5678",
        sector: "Logística",
        estado: "Activo",
        valorAnual: 900000
      }
    ],
    cotizaciones: [
      {
        folio: "COT-TEST-1",
        clienteId: 8,
        fecha: "2026-11-19",
        vigencia: "2026-12-19",
        estado: "Enviada",
        probabilidad: 50,
        concepto: "Proyecto confidencial",
        total: 123456
      }
    ],
    alertasServidor: [
      {
        servicio: "Servicio interno",
        severidad: "Alta",
        estado: "Activa",
        mensaje: "Detalle técnico confidencial",
        region: "Región privada"
      }
    ],
    seguimientosWhatsApp: [
      {
        clienteId: 8,
        fecha: "2026-11-19T10:00:00-06:00",
        estado: "Pendiente",
        contacto: "Contacto Confidencial",
        mensaje: "Mensaje privado",
        proximoPaso: "Acción confidencial"
      }
    ]
  });
  const serialized = JSON.stringify(context);

  assert.equal(context.resumen.clientes, 1);
  assert.equal(context.cotizaciones.registros[0].estado, "Enviada");
  assert.equal(context.alertasServidor.registros[0].severidad, "Alta");
  assert.equal(context.seguimientosWhatsApp.registros[0].estado, "Pendiente");
  for (const privateValue of [
    "Persona Confidencial",
    "Empresa Reservada",
    "persona@ejemplo.mx",
    "+52 55 1234 5678",
    "900000",
    "123456",
    "Proyecto confidencial",
    "Detalle técnico confidencial",
    "Región privada",
    "Mensaje privado",
    "Acción confidencial"
  ]) {
    assert.equal(serialized.includes(privateValue), false, `${privateValue} should be excluded`);
  }
});

test("user message contact details are redacted before sending to the provider", () => {
  const sanitized = sanitizeUserMessage(
    "Contacta a ana.garcia@ejemplo.mx al +52 55 1234 5678 para la propuesta."
  );

  assert.match(sanitized, /\[correo omitido\]/);
  assert.match(sanitized, /\[teléfono omitido\]/);
  assert.doesNotMatch(sanitized, /ana\.garcia@ejemplo\.mx|\+52 55 1234 5678/);
});
