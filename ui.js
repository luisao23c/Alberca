const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS_CORTOS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export { MESES, DIAS_CORTOS };

export const formatMoney = (valor) => currency.format(Number(valor) || 0);

/** Convierte una fecha a `YYYY-MM-DD` usando la zona horaria local. */
export function toISODate(date) {
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mes}-${dia}`;
}

/** Interpreta `YYYY-MM-DD` como fecha local (evita el corrimiento por UTC). */
export function parseISODate(iso) {
  if (!iso) return null;
  const [anio, mes, dia] = String(iso).split("-").map(Number);
  if (!anio || !mes || !dia) return null;
  return new Date(anio, mes - 1, dia);
}

export function formatLongDate(iso) {
  const date = parseISODate(iso);
  if (!date) return "—";
  return `${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`;
}

export function formatShortDate(iso) {
  const date = parseISODate(iso);
  if (!date) return "—";
  return `${String(date.getDate()).padStart(2, "0")} ${MESES[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

export const isPagado = (adelanto) =>
  String(adelanto).trim().toLowerCase() === "pagado";

export const montoAbonado = (reserva, precio) =>
  isPagado(reserva.adelanto) ? precio : Number(reserva.adelanto) || 0;

export const restante = (reserva, precio) =>
  Math.max(precio - montoAbonado(reserva, precio), 0);

export function escapeHtml(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

/** Notificación flotante que reemplaza a los `alert()` bloqueantes. */
export function toast(mensaje, tipo = "info") {
  let contenedor = document.querySelector(".toast-stack");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.className = "toast-stack";
    document.body.appendChild(contenedor);
  }
  const nodo = document.createElement("div");
  nodo.className = `toast toast--${tipo}`;
  nodo.setAttribute("role", "status");
  nodo.textContent = mensaje;
  contenedor.appendChild(nodo);
  setTimeout(() => {
    nodo.classList.add("toast--out");
    nodo.addEventListener("transitionend", () => nodo.remove(), { once: true });
  }, 3500);
}

export function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("is-open");
  document.body.classList.add("no-scroll");
  modal.querySelector("input, button, select")?.focus();
}

export function closeModal(id) {
  document.getElementById(id)?.classList.remove("is-open");
  if (!document.querySelector(".modal.is-open")) {
    document.body.classList.remove("no-scroll");
  }
}

/** Cierra modales al pulsar el fondo, la X o la tecla Escape. */
export function initModals() {
  document.addEventListener("click", (e) => {
    const cerrar = e.target.closest("[data-close-modal]");
    if (cerrar) closeModal(cerrar.closest(".modal").id);
    if (e.target.classList.contains("modal")) closeModal(e.target.id);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal.is-open").forEach((m) => closeModal(m.id));
    }
  });
}

export function initNav() {
  const actual = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav__link").forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.toggle("is-active", href === actual);
    if (href === actual) link.setAttribute("aria-current", "page");
  });
}
