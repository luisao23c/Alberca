import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAsz6H2eZt7e_WpDPy6oAWKjs_Gylx9FfE",
  authDomain: "alberca-5be78.firebaseapp.com",
  projectId: "alberca-5be78",
  storageBucket: "alberca-5be78.appspot.com",
  messagingSenderId: "628981298379",
  appId: "1:628981298379:web:44f596026e8e1cc1dd974e",
  measurementId: "G-SMBE25B27E",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const RESERVAS = "users";
export const CONFIGURACIONES = "configuraciones";
export const CONFIG_ID = "Vq4uaOxlUotSqCRdwnbe";

export const saveReserva = (nombre, adelanto, fecha_asignada) =>
  addDoc(collection(db, RESERVAS), { nombre, adelanto, fecha_asignada });

export const updateReserva = (id, campos) =>
  updateDoc(doc(db, RESERVAS, id), campos);

export const deleteReserva = (id) => deleteDoc(doc(db, RESERVAS, id));

export async function getReservas() {
  const snapshot = await getDocs(
    query(collection(db, RESERVAS), orderBy("fecha_asignada"))
  );
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      nombre: data.nombre ?? "",
      adelanto: data.adelanto ?? "0",
      fecha_asignada: data.fecha_asignada ?? "",
    };
  });
}

/**
 * El documento de configuración guarda el precio como `{ precio: { precio: "500" } }`
 * en los datos históricos, por lo que se aceptan ambas formas al leer.
 */
export async function getPrecio() {
  const snapshot = await getDocs(collection(db, CONFIGURACIONES));
  const config = snapshot.docs.find((d) => d.id === CONFIG_ID) ?? snapshot.docs[0];
  if (!config) return 0;
  const valor = config.data().precio;
  const bruto = valor && typeof valor === "object" ? valor.precio : valor;
  return Number(bruto) || 0;
}

export const setPrecio = (precio) =>
  updateDoc(doc(db, CONFIGURACIONES, CONFIG_ID), {
    precio: { precio: String(precio) },
  });
