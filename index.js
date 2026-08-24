import { getPrecio, getReservas, saveReserva } from "./firestore.js";
import {
  DIAS_CORTOS,
  MESES,
  formatLongDate,
  formatMoney,
  initNav,
  toISODate,
  toast,
} from "./ui.js";

const $ = (id) => document.getElementById(id);

const state = {
  precio: 0,
  ocupadas: new Set(),
  seleccion: null,
  mes: new Date().getMonth(),
  anio: new Date().getFullYear(),
};

initNav();

function renderWeekdays() {
  $("calendario-dias").innerHTML = DIAS_CORTOS.map((d) => `<span>${d}</span>`).join("");
}

function renderCalendar() {
  const grid = $("calendario");
  $("mes-actual").textContent = `${MESES[state.mes]} ${state.anio}`;

  const primero = new Date(state.anio, state.mes, 1);
  const diasEnMes = new Date(state.anio, state.mes + 1, 0).getDate();
  const offset = (primero.getDay() + 6) % 7; // semana que inicia en lunes
  const hoyISO = toISODate(new Date());

  const celdas = [];
  for (let i = 0; i < offset; i++) {
    celdas.push('<div class="day day--empty"></div>');
  }
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const iso = toISODate(new Date(state.anio, state.mes, dia));
    const ocupado = state.ocupadas.has(iso);
    const pasado = iso < hoyISO;
    const clases = ["day"];
    if (ocupado) clases.push("day--ocupado");
    if (iso === hoyISO) clases.push("day--hoy");
    if (iso === state.seleccion) clases.push("day--seleccionado");
    celdas.push(
      `<button type="button" class="${clases.join(" ")}" data-fecha="${iso}"
        ${ocupado || pasado ? "disabled" : ""}
        aria-label="${dia} de ${MESES[state.mes]}${ocupado ? ", apartado" : ""}">${dia}</button>`
    );
  }
  grid.innerHTML = celdas.join("");
}

function renderResumen() {
  const adelanto = Number($("adelanto").value) || 0;
  $("resumen-costo").textContent = formatMoney(state.precio);
  $("resumen-adelanto").textContent = formatMoney(adelanto);
  $("resumen-resta").textContent = formatMoney(Math.max(state.precio - adelanto, 0));
}

function setError(campo, visible) {
  $(`error-${campo}`).classList.toggle("is-visible", visible);
  $(campo === "fecha" ? "fecha" : campo).classList.toggle("input--error", visible);
}

async function cargarDatos() {
  try {
    const [precio, reservas] = await Promise.all([getPrecio(), getReservas()]);
    state.precio = precio;
    state.ocupadas = new Set(reservas.map((r) => r.fecha_asignada));
    $("precio-actual").textContent = formatMoney(precio);
    $("adelanto").max = String(precio);
    renderCalendar();
    renderResumen();
  } catch (error) {
    console.error(error);
    toast("No se pudieron cargar los datos. Revisa tu conexión.", "error");
  }
}

$("calendario").addEventListener("click", (e) => {
  const boton = e.target.closest(".day[data-fecha]");
  if (!boton || boton.disabled) return;
  state.seleccion = boton.dataset.fecha;
  $("fecha").value = formatLongDate(state.seleccion);
  setError("fecha", false);
  renderCalendar();
});

$("mes-anterior").addEventListener("click", () => {
  state.mes -= 1;
  if (state.mes < 0) {
    state.mes = 11;
    state.anio -= 1;
  }
  renderCalendar();
});

$("mes-siguiente").addEventListener("click", () => {
  state.mes += 1;
  if (state.mes > 11) {
    state.mes = 0;
    state.anio += 1;
  }
  renderCalendar();
});

$("adelanto").addEventListener("input", () => {
  const valor = Number($("adelanto").value);
  setError("adelanto", $("adelanto").value !== "" && (valor < 0 || valor > state.precio));
  renderResumen();
});

$("pago-mitad").addEventListener("click", () => {
  $("adelanto").value = String(Math.round(state.precio / 2));
  setError("adelanto", false);
  renderResumen();
});

$("pago-total").addEventListener("click", () => {
  $("adelanto").value = String(state.precio);
  setError("adelanto", false);
  renderResumen();
});

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = $("nombre").value.trim();
  const adelanto = Number($("adelanto").value);

  const errorNombre = nombre.length < 2;
  const errorAdelanto =
    $("adelanto").value === "" || Number.isNaN(adelanto) || adelanto < 0 || adelanto > state.precio;
  const errorFecha = !state.seleccion;

  setError("nombre", errorNombre);
  setError("adelanto", errorAdelanto);
  setError("fecha", errorFecha);
  if (errorNombre || errorAdelanto || errorFecha) {
    toast("Revisa los campos marcados.", "warning");
    return;
  }
  if (state.ocupadas.has(state.seleccion)) {
    toast("Esa fecha acaba de ocuparse, elige otra.", "error");
    await cargarDatos();
    return;
  }

  const boton = $("insert");
  boton.disabled = true;
  boton.textContent = "Guardando...";
  try {
    const valor = adelanto >= state.precio ? "pagado" : String(adelanto);
    await saveReserva(nombre, valor, state.seleccion);
    state.ocupadas.add(state.seleccion);
    toast(`Reserva de ${nombre} registrada.`, "success");
    $("form").reset();
    state.seleccion = null;
    $("fecha").value = "";
    renderCalendar();
    renderResumen();
  } catch (error) {
    console.error(error);
    toast("No se pudo guardar la reserva.", "error");
  } finally {
    boton.disabled = false;
    boton.textContent = "Agregar reserva";
  }
});

renderWeekdays();
renderCalendar();
cargarDatos();
