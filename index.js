import { saveuser,getusers,getconfiguraciones } from "../firestore.js";

window.addEventListener("DOMContentLoaded", () => {
  
});
let fecha_asignada = null;
 var array = [];
let costo = "";
 async function reload_dates(){
  const querysnapshot = await getusers();
  querysnapshot.forEach(doc => {
     const fecha = doc.data().fecha_asignada;
     array.push(fecha);
 })
 }
 const querysnapshot = await getconfiguraciones();
 querysnapshot.forEach((doc) => {
   costo = doc.data().precio.precio;
   document.getElementById("recordar_costo").innerHTML =
  `
  <p class="">  <span style="font-weight:800;">Nuevo usuario  /  Costo de la renta :${costo}</span></p>
  `;

   let adelanto_input = document.getElementById("adelanto");
   adelanto_input.setAttribute("min",1);
   adelanto_input.setAttribute("max",costo);
   adelanto_input.addEventListener('input',function(){
   
    if (this.value.length > costo.length)
    { 
       this.value = this.value.slice(0,4); 
    }
    if (parseInt(this.value) > costo){
    alert("no se puede superar el costo se regresara al estado incial intentelo de nuevo");
    adelanto_input.value ="";
    }
  })
   $("#Configuraciones").modal("hide");
 }); 

 reload_dates();
 
$("#doi").datepicker({
  closeText: 'Cerrar',
  prevText: '<Ant',
  nextText: 'Sig>',
  currentText: 'Hoy',
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Juv', 'Vie', 'Sáb'],
  dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
  weekHeader: 'Sm',
  firstDay: 1,
  isRTL: false,
  showMonthAfterYear: false,
  yearSuffix: '',
  onSelect: function (dateText, inst) {
    fecha_asignada = dateText;
  },
  beforeShowDay: function (date) {
    var string = jQuery.datepicker.formatDate("yy-mm-dd", date);
    return [array.indexOf(string) == -1];
  },
  
});

const form = document.getElementById("form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const info = fecha_asignada.split('/');
  fecha_asignada = info[2] + '-' + info[0] + '-' + info[1];
  const name = document.getElementById("nombre").value;
  let adelanto = document.getElementById("adelanto").value;
  if (parseInt(adelanto) ==costo){
    adelanto ="pagado";
  }
  saveuser(name, adelanto,fecha_asignada);
  reload_dates();
  form.reset()
  alert("Se ha registrado correctamente");
});
