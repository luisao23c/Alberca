import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore,collection,addDoc,getDocs,updateDoc,doc,deleteDoc} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-analytics.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAsz6H2eZt7e_WpDPy6oAWKjs_Gylx9FfE",
  authDomain: "alberca-5be78.firebaseapp.com",
  projectId: "alberca-5be78",
  storageBucket: "alberca-5be78.appspot.com",
  messagingSenderId: "628981298379",
  appId: "1:628981298379:web:44f596026e8e1cc1dd974e",
  measurementId: "G-SMBE25B27E",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore();
export const saveuser = (nombre,adelanto,fecha_asignada)=>
addDoc(collection(db, "users"),{nombre,adelanto,fecha_asignada});
export const getusers= () =>getDocs(collection(db, "users"));
export const updateusers = (id,field) => updateDoc(doc(db, "users",id),field);
export const updateconfiguraciones = (id,precio)=>
updateDoc(doc(db, "configuraciones",id),{precio});
export const getconfiguraciones= () =>getDocs(collection(db, "configuraciones"));
export const deleteuser = (id) => deleteDoc(doc(db, "users", id));