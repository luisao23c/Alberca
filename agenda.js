import {
  deleteReserva,
  getPrecio,
  getReservas,
  setPrecio,
  updateReserva,
} from "./firestore.js";
import {
  closeModal,
  escapeHtml,
  formatMoney,
  formatShortDate,
  initModals,
  initNav,
  isPagado,
  montoAbonado,
  openModal,
  restante,
  toast,
} from "./ui.js";

const $ = (id) => document.getElementById(id);

const state = {
  precio: 0,
  reservas: [],
  orden: { campo: "fecha_asignada", asc: true },
  seleccionada: null,
};

initNav();
initModals();

function decorar(reserva) {
  return {
    ...reserva,
    abonado: montoAbonado(reserva, state.precio),
    resta: restante(reserva, state.precio),
    estado: isPagado(reserva.adelanto) || restante(reserva, state.precio) === 0 ? "pagado" : "pendiente",
  };
}

function filtrar() {
  const texto = $("buscar").value.trim().toLowerCase();
  const estado = $("estado").value;
  const desde = $("desde").value;
  const hasta = $("hasta").value;

  return state.reservas
    .map(decorar)
    .filter((r) => !texto || r.nombre.toLowerCase().includes(texto))
    .filter((r) => estado === "todas" || r.estado === estado)
    .filter((r) => !desde || r.fecha_asignada >= desde)
    .filter((r) => !hasta || r.fecha_asignada <= hasta)
    .sort((a, b) => {
      const { campo, asc } = state.orden;
      const x = a[campo];
      const y = b[campo];
      const cmp = typeof x === "number" ? x - y : String(x).localeCompare(String(y), "es");
      return asc ? cmp : -cmp;
    });
}

function renderStats(filas) {
  const pagadas = filas.filter((r) => r.estado === "pagado").length;
  const cobrado = filas.reduce((total, r) => total + r.abonado, 0);
  const porCobrar = filas.reduce((total, r) => total + r.resta, 0);
  $("stat-total").textContent = filas.length;
  $("stat-pagadas").textContent = pagadas;
  $("stat-pendientes").textContent = filas.length - pagadas;
  $("stat-cobrado").textContent = formatMoney(cobrado);
  $("stat-por-cobrar").textContent = formatMoney(porCobrar);
}

function render() {
  const filas = filtrar();
  renderStats(filas);
  $("vacio").hidden = filas.length > 0;

  $("tbody").innerHTML = filas
    .map(
      (r) => `
      <tr data-id="${r.id}">
        <td>${escapeHtml(r.nombre)}</td>
        <td>${formatShortDate(r.fecha_asignada)}</td>
        <td>${formatMoney(r.abonado)}</td>
        <td>${formatMoney(r.resta)}</td>
        <td><span class="badge badge--${r.estado}">${r.estado === "pagado" ? "Pagado" : "Pendiente"}</span></td>
        <td class="actions">
          ${
            r.estado === "pendiente"
              ? '<button class="btn btn--verde btn--sm" data-accion="pagar">Cobrar</button>'
              : ""
          }
          <button class="btn btn--ghost btn--sm" data-accion="editar">Editar</button>
          <button class="btn btn--rojo btn--sm" data-accion="eliminar">Eliminar</button>
        </td>
      </tr>`
    )
    .join("");
}

async function cargar() {
  try {
    const [precio, reservas] = await Promise.all([getPrecio(), getReservas()]);
    state.precio = precio;
    state.reservas = reservas;
    $("precio-actual").textContent = formatMoney(precio);
    $("nuevo-precio").value = String(precio);
    render();
  } catch (error) {
    console.error(error);
    $("tbody").innerHTML = "";
    $("vacio").hidden = false;
    toast("No se pudieron cargar las reservas.", "error");
  }
}

function reservaPorId(id) {
  return state.reservas.find((r) => r.id === id) ?? null;
}

$("tbody").addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const id = boton.closest("tr").dataset.id;
  const reserva = reservaPorId(id);
  if (!reserva) return;
  state.seleccionada = decorar(reserva);

  if (boton.dataset.accion === "pagar") {
    $("pago-detalle").textContent =
      `${state.seleccionada.nombre} debe ${formatMoney(state.seleccionada.resta)} de ${formatMoney(state.precio)}.`;
    $("pago-monto").value = String(state.seleccionada.resta);
    $("pago-monto").max = String(state.seleccionada.resta);
    openModal("modal-pago");
  } else if (boton.dataset.accion === "editar") {
    $("editar-nombre").value = state.seleccionada.nombre;
    $("editar-fecha").value = state.seleccionada.fecha_asignada;
    $("error-editar-fecha").classList.remove("is-visible");
    openModal("modal-editar");
  } else {
    $("eliminar-detalle").textContent =
      `¿Eliminar la reserva de ${state.seleccionada.nombre} del ${formatShortDate(state.seleccionada.fecha_asignada)}?`;
    openModal("modal-eliminar");
  }
});

$("confirmar-pago").addEventListener("click", async () => {
  const reserva = state.seleccionada;
  if (!reserva) return;
  const monto = Number($("pago-monto").value);
  if (Number.isNaN(monto) || monto <= 0) {
    toast("Ingresa un monto válido.", "warning");
    return;
  }
  const nuevoAbono = reserva.abonado + monto;
  const valor = nuevoAbono >= state.precio ? "pagado" : String(nuevoAbono);
  try {
    await updateReserva(reserva.id, { adelanto: valor });
    reservaPorId(reserva.id).adelanto = valor;
    closeModal("modal-pago");
    render();
    toast(valor === "pagado" ? "Reserva liquidada." : "Abono registrado.", "success");
  } catch (error) {
    console.error(error);
    toast("No se pudo registrar el pago.", "error");
  }
});

$("confirmar-editar").addEventListener("click", async () => {
  const reserva = state.seleccionada;
  if (!reserva) return;
  const nombre = $("editar-nombre").value.trim();
  const fecha = $("editar-fecha").value;
  if (nombre.length < 2 || !fecha) {
    toast("Completa nombre y fecha.", "warning");
    return;
  }
  const ocupada = state.reservas.some(
    (r) => r.id !== reserva.id && r.fecha_asignada === fecha
  );
  $("error-editar-fecha").classList.toggle("is-visible", ocupada);
  if (ocupada) return;

  try {
    await updateReserva(reserva.id, { nombre, fecha_asignada: fecha });
    Object.assign(reservaPorId(reserva.id), { nombre, fecha_asignada: fecha });
    closeModal("modal-editar");
    render();
    toast("Reserva actualizada.", "success");
  } catch (error) {
    console.error(error);
    toast("No se pudo actualizar la reserva.", "error");
  }
});

$("confirmar-eliminar").addEventListener("click", async () => {
  const reserva = state.seleccionada;
  if (!reserva) return;
  try {
    await deleteReserva(reserva.id);
    state.reservas = state.reservas.filter((r) => r.id !== reserva.id);
    closeModal("modal-eliminar");
    render();
    toast("Reserva eliminada.", "success");
  } catch (error) {
    console.error(error);
    toast("No se pudo eliminar la reserva.", "error");
  }
});

$("abrir-config").addEventListener("click", () => {
  $("nuevo-precio").value = String(state.precio);
  $("error-precio").classList.remove("is-visible");
  openModal("modal-config");
});

$("guardar-precio").addEventListener("click", async () => {
  const precio = Number($("nuevo-precio").value);
  const invalido = Number.isNaN(precio) || precio <= 0;
  $("error-precio").classList.toggle("is-visible", invalido);
  if (invalido) return;
  try {
    await setPrecio(precio);
    state.precio = precio;
    $("precio-actual").textContent = formatMoney(precio);
    closeModal("modal-config");
    render();
    toast("Precio actualizado.", "success");
  } catch (error) {
    console.error(error);
    toast("No se pudo guardar el precio.", "error");
  }
});

["buscar", "estado", "desde", "hasta"].forEach((id) =>
  $(id).addEventListener("input", render)
);

$("limpiar").addEventListener("click", () => {
  $("buscar").value = "";
  $("estado").value = "todas";
  $("desde").value = "";
  $("hasta").value = "";
  render();
});

document.querySelectorAll("th[data-sort]").forEach((th) =>
  th.addEventListener("click", () => {
    const campo = th.dataset.sort;
    state.orden = {
      campo,
      asc: state.orden.campo === campo ? !state.orden.asc : true,
    };
    render();
  })
);

cargar();
