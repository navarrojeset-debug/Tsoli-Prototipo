import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import actionsRouter from "./routes/actions.js";
import pagesRouter from "./routes/pages.js";

const app = express();
const port = Number(process.env.PORT) || 3000;
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

app.set("view engine", "ejs");
app.set("views", path.join(currentDirectory, "views"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "16kb" }));
app.use(express.static(path.join(currentDirectory, "public")));

app.locals.navigation = [
  { id: "dashboard", label: "Inicio", href: "/dashboard", icon: "space_dashboard" },
  { id: "copiloto", label: "Copiloto IA", href: "/copiloto", icon: "smart_toy" },
  { id: "proyectos", label: "Proyectos", href: "/proyectos", icon: "folder_managed" },
  { id: "documentos", label: "Documentos", href: "/documentos", icon: "description" },
  { id: "configuracion", label: "Perfil y configuración", href: "/configuracion", icon: "settings" },
  { id: "planes", label: "Planes y suscripción", href: "/planes", icon: "credit_card" }
];
app.locals.formatMXN = (amount) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(amount);

app.use("/", pagesRouter);
app.use("/", actionsRouter);

app.use((req, res) => {
  res.status(404).render("error", {
    status: 404,
    title: "Página no encontrada",
    message: "La dirección que buscas no existe en este prototipo."
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (req.path.startsWith("/api/")) {
    const status = error?.type === "entity.too.large"
      ? 413
      : error?.type === "entity.parse.failed"
        ? 400
        : 500;
    console.error("API request failed", {
      path: req.path,
      status,
      type: error?.type ?? error?.name ?? "Error"
    });
    return res.status(status).json({
      error: status === 413
        ? "La solicitud excede el tamaño permitido."
        : status === 400
          ? "El cuerpo de la solicitud debe ser JSON válido."
          : "Ocurrió un error interno al procesar el chat."
    });
  }

  console.error(error);
  res.status(500).render("error", {
    status: 500,
    title: "No se pudo completar la solicitud",
    message: "Ocurrió un error al cargar los datos locales. Revisa la terminal para más detalles."
  });
});

app.listen(port, () => {
  console.log(`TSOLI OS disponible en http://localhost:${port}`);
});
