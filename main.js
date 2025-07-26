/*********** Firebase Configuración REALTIME COMPATIBLE ************/
const firebaseConfig = {
  apiKey: "AIzaSyCIQO-8RFEy53IDe3xTlbjPvvLImXJOCPM",
  authDomain: "p-v-maracuya-sede-garcilazo.firebaseapp.com",
  databaseURL: "https://p-v-maracuya-sede-garcilazo-default-rtdb.firebaseio.com",
  projectId: "p-v-maracuya-sede-garcilazo",
  storageBucket: "p-v-maracuya-sede-garcilazo.appspot.com",
  messagingSenderId: "404482298278",
  appId: "1:404482298278:web:7348c9720073266e727f67"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/*********** Variables globales ************/
let productos = []; // productos desde Firebase
let venta = []; // productos en la venta
let correlativo = { boleta: 1, nota: 1 };

/*********** Al cargar la página: cargar productos y correlativos ************/
window.onload = function() {
  cargarProductos();
  cargarCorrelativos();
  document.getElementById("buscarProducto").addEventListener("input", filtrarProductos);
  document.getElementById("abrirModalProducto").onclick = abrirModalProducto;
  document.getElementById("guardarProductoNuevo").onclick = guardarProductoNuevo;
  document.getElementById("guardarCambiosProducto").onclick = guardarCambiosProducto; // Dummy, se sobreescribe al editar
  document.getElementById("cerrarModalProducto").onclick = cerrarModalProducto;
  if(document.getElementById("cancelarProducto"))
    document.getElementById("cancelarProducto").onclick = cerrarModalProducto;
  document.getElementById("guardarComprobante").onclick = guardarComprobante;
  document.getElementById("imprimirComprobante").onclick = imprimirComprobante;
  document.getElementById("verComprobantes").onclick = mostrarModalComprobantes;
  document.getElementById("cerrarModalComprobantes").onclick = cerrarModalComprobantes;
  document.getElementById("tipoComprobante").onchange = actualizarCorrelativoPreview;
  document.getElementById("formatoImpresion").onchange = ocultarPreview;
  actualizarTablaVenta();
}

/*********** Productos ************/
function cargarProductos() {
  db.ref("productos").on("value", snap => {
    productos = [];
    snap.forEach(child => {
      productos.push(child.val());
    });
  });
}

// Busca productos, muestra lista con botón editar (✏️)
function filtrarProductos() {
  let q = document.getElementById("buscarProducto").value.trim().toLowerCase();
  let list = document.getElementById("listaBusqueda");
  list.innerHTML = "";
  if(q.length < 1) return;
  let filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
  );
  filtrados.slice(0,8).forEach(prod => {
    let div = document.createElement("div");
    div.innerHTML = `
      <span style="cursor:pointer" onclick='seleccionarProductoDesdeBusqueda("${prod.codigo}")'>
        ${prod.nombre} | ${prod.codigo} | S/ ${prod.precio}
      </span>
      <button class="edit-btn" onclick='editarProducto("${prod.codigo}");event.stopPropagation();'
        style="background:#2264bc;color:#fff;font-size:1em;margin-left:8px;padding:3px 10px;border:none;border-radius:7px;cursor:pointer" title="Editar producto">
        ✏️
      </button>
    `;
    list.appendChild(div);
  });
}
window.seleccionarProductoDesdeBusqueda = function(codigo) {
  let prod = productos.find(p => p.codigo === codigo);
  seleccionarProducto(prod);
}

function seleccionarProducto(prod) {
  document.getElementById("buscarProducto").value = "";
  document.getElementById("listaBusqueda").innerHTML = "";
  let existe = venta.find(x => x.codigo === prod.codigo);
  if(existe) {
    existe.cantidad++;
  } else {
    venta.push({ ...prod, cantidad: 1 });
  }
  actualizarTablaVenta();
}

// ABRIR modal para agregar (en modo agregar)
function abrirModalProducto() {
  document.getElementById("modalProducto").style.display = "flex";
  document.getElementById("msgProductoNuevo").textContent = "";
  document.getElementById("nuevoProductoCodigo").disabled = false;
  document.getElementById("guardarProductoNuevo").style.display = "inline-block";
  document.getElementById("guardarCambiosProducto").style.display = "none";
  if(document.getElementById("tituloModalProducto"))
    document.getElementById("tituloModalProducto").textContent = "Agregar nuevo producto";
}

// CERRAR modal y limpiar todo
function cerrarModalProducto() {
  document.getElementById("modalProducto").style.display = "none";
  document.getElementById("nuevoProductoNombre").value = "";
  document.getElementById("nuevoProductoCodigo").value = "";
  document.getElementById("nuevoProductoCodigo").disabled = false;
  document.getElementById("nuevoProductoPrecio").value = "";
  document.getElementById("msgProductoNuevo").textContent = "";
  document.getElementById("guardarProductoNuevo").style.display = "inline-block";
  document.getElementById("guardarCambiosProducto").style.display = "none";
  if(document.getElementById("tituloModalProducto"))
    document.getElementById("tituloModalProducto").textContent = "Agregar nuevo producto";
}

// GUARDAR producto nuevo (desde modal)
function guardarProductoNuevo() {
  let nombre = document.getElementById("nuevoProductoNombre").value.trim();
  let codigo = document.getElementById("nuevoProductoCodigo").value.trim();
  let precio = parseFloat(document.getElementById("nuevoProductoPrecio").value);
  let msg = document.getElementById("msgProductoNuevo");
  if(!nombre || !codigo || isNaN(precio)) {
    msg.textContent = "Completa todos los campos correctamente.";
    msg.style.color = "#d33";
    return;
  }
  if(productos.find(p => p.codigo === codigo)) {
    msg.textContent = "Ya existe un producto con ese código de barras.";
    msg.style.color = "#d33";
    return;
  }
  let prod = { nombre, codigo, precio };
  db.ref("productos/" + codigo).set(prod);
  msg.style.color = "#2ac77d";
  msg.textContent = "Producto guardado correctamente.";
  setTimeout(cerrarModalProducto, 800);
}

// ABRIR modal en modo EDITAR, llena datos, solo "Guardar Cambios"
window.editarProducto = function(codigo) {
  let prod = productos.find(p => p.codigo === codigo);
  if(!prod) return;
  document.getElementById("modalProducto").style.display = "flex";
  document.getElementById("msgProductoNuevo").textContent = "";
  document.getElementById("nuevoProductoNombre").value = prod.nombre;
  document.getElementById("nuevoProductoCodigo").value = prod.codigo;
  document.getElementById("nuevoProductoCodigo").disabled = true; // No editar código
  document.getElementById("nuevoProductoPrecio").value = prod.precio;
  document.getElementById("guardarProductoNuevo").style.display = "none";
  document.getElementById("guardarCambiosProducto").style.display = "inline-block";
  if(document.getElementById("tituloModalProducto"))
    document.getElementById("tituloModalProducto").textContent = "Editar producto";
  // Evento guardar cambios (solo esta instancia)
  document.getElementById("guardarCambiosProducto").onclick = function() {
    let nombre = document.getElementById("nuevoProductoNombre").value.trim();
    let precio = parseFloat(document.getElementById("nuevoProductoPrecio").value);
    let msg = document.getElementById("msgProductoNuevo");
    if(!nombre || isNaN(precio)) {
      msg.textContent = "Completa todos los campos correctamente.";
      msg.style.color = "#d33";
      return;
    }
    db.ref("productos/" + prod.codigo).set({ nombre, codigo: prod.codigo, precio });
    msg.style.color = "#2ac77d";
    msg.textContent = "Producto modificado correctamente.";
    setTimeout(() => {
      cerrarModalProducto();
    }, 800);
  };
};

/*********** Venta y Tabla ************/
function actualizarTablaVenta() {
  let tbody = document.getElementById("tbodyVenta");
  tbody.innerHTML = "";
  let total = 0;
  venta.forEach((prod, i) => {
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${prod.nombre}</td>
      <td>${prod.codigo}</td>
      <td>S/ ${prod.precio.toFixed(2)}</td>
      <td>
        <input type="number" min="1" value="${prod.cantidad}" 
          onchange="actualizarCantidad(${i}, this.value)" style="width:56px"/>
      </td>
      <td>S/ ${(prod.precio * prod.cantidad).toFixed(2)}</td>
      <td><button onclick="eliminarProducto(${i})">&times;</button></td>
    `;
    tbody.appendChild(tr);
    total += prod.precio * prod.cantidad;
  });
  // IGV incluido
  let igv = total * 18 / 118;
  document.getElementById("ventaTotal").textContent = "S/ " + total.toFixed(2);
  document.getElementById("ventaIGV").textContent = "S/ " + igv.toFixed(2);
}
window.actualizarCantidad = function(i, val) {
  val = parseInt(val);
  if(val < 1) val = 1;
  venta[i].cantidad = val;
  actualizarTablaVenta();
}
window.eliminarProducto = function(i) {
  venta.splice(i,1);
  actualizarTablaVenta();
}

/*********** Correlativos ************/
function cargarCorrelativos() {
  db.ref("correlativos").once("value", snap => {
    if(snap.exists()) correlativo = snap.val();
    else db.ref("correlativos").set(correlativo);
    actualizarCorrelativoPreview();
  });
}
function actualizarCorrelativoPreview() {
  let tipo = document.getElementById("tipoComprobante").value;
  let num = correlativo[tipo] || 1;
  document.getElementById("ventaNum")?.remove();
  let node = document.createElement("span");
  node.id = "ventaNum";
  node.innerHTML = `N° ${tipo === "boleta" ? "B" : "NV"}-${String(num).padStart(8, '0')}`;
  document.querySelector(".empresa-info").appendChild(node);
}

/*********** Guardar Comprobante (corrige boleta/nota) ************/
function guardarComprobante() {
  if(venta.length == 0) return alert("Agrega productos a la venta.");
  let tipo = document.getElementById("tipoComprobante").value;
  let cliente = {
    nombre: document.getElementById("clienteNombre").value.trim(),
    doc: document.getElementById("clienteDoc").value.trim(),
    dir: document.getElementById("clienteDir").value.trim(),
  };
  // BOLETA: cliente obligatorio
  if(tipo === "boleta" && (!cliente.nombre || !cliente.doc)) 
    return alert("Completa los datos del cliente.");
  let num = correlativo[tipo] || 1;
  let fecha = new Date().toLocaleDateString("es-PE") + " " +
              new Date().toLocaleTimeString("es-PE", { hour12:false }).slice(0,5);
  let total = venta.reduce((a,b) => a + b.precio * b.cantidad, 0);
  let igv = total * 18 / 118;
  let comprobante = {
    tipo, num, fecha, cliente, venta: JSON.parse(JSON.stringify(venta)), total, igv
  };
  // Solo BOLETA guarda en firebase y usa correlativo
  if(tipo === "boleta") {
    let id = tipo + "-" + String(num).padStart(8,'0');
    db.ref("comprobantes/"+id).set(comprobante);
    correlativo[tipo]++;
    db.ref("correlativos").set(correlativo);
  }
  alert("Comprobante guardado exitosamente.");
  // Limpiar venta y datos cliente SIEMPRE
  venta = [];
  document.getElementById("clienteNombre").value = "";
  document.getElementById("clienteDoc").value = "";
  document.getElementById("clienteDir").value = "";
  actualizarTablaVenta();
  actualizarCorrelativoPreview();
  mostrarPreviewComprobante(comprobante);
}

/*********** Vista previa e impresión / PDF (corrige boleta/nota) ************/
function mostrarPreviewComprobante(comp) {
  let preview = document.getElementById("comprobantePreview");
  let formato = document.getElementById("formatoImpresion").value;
  let esA4 = formato === "a4";
  let prodRows = comp.venta.map(p =>
    `<tr><td>${p.cantidad}</td><td>${p.codigo}</td><td>${p.nombre}</td>
      <td>S/ ${(p.precio).toFixed(2)}</td><td>S/ ${(p.precio*p.cantidad).toFixed(2)}</td></tr>`
  ).join("");
  let html = "";
  if(comp.tipo === "boleta") {
    let qrSrc = generarQrSunat();
    html = `
      <div class="doc-preview" style="width:${esA4?'700px':'340px'};font-size:${esA4?'1em':'0.87em'}">
        <div style="text-align:center">
          <div style="font-size:1.6em;font-weight:700;color:#22bb77">MARACUYA TIENDAS SALUDABLES E.I.R.L</div>
          <div style="font-size:1.1em;color:#444">RUC: 20650404517</div>
          <div style="margin-bottom:4px;font-size:0.98em">Calle Garcilazo de la Vega 121 - Salamanca, Ate, Lima, Perú</div>
          <div style="font-size:1.1em;font-weight:500;margin-top:7px">
            BOLETA DE VENTA ELECTRÓNICA
          </div>
          <div style="font-size:1.02em">N° B-${String(comp.num).padStart(8, '0')}</div>
        </div>
        <hr>
        <div style="font-size:1.02em">
          <b>Cliente:</b> ${comp.cliente.nombre}<br>
          <b>${comp.cliente.doc.length===8?'DNI':'RUC'}:</b> ${comp.cliente.doc}<br>
          <b>Dirección:</b> ${comp.cliente.dir}
        </div>
        <div style="font-size:0.97em;margin:9px 0">
          <b>Fecha:</b> ${comp.fecha}
        </div>
        <table style="width:100%;border-collapse:collapse;margin:14px 0 6px 0;font-size:0.97em">
          <thead><tr style="background:#e9e9e9">
            <th>Cant</th><th>Código</th><th>Descripción</th><th>P.Unit</th><th>Total</th>
          </tr></thead>
          <tbody>${prodRows}</tbody>
        </table>
        <div style="text-align:right;margin:10px 0 5px 0;font-size:1.08em">
          <div>Op. Gravada: S/ ${(comp.total-comp.igv).toFixed(2)}</div>
          <div>IGV (18%): S/ ${comp.igv.toFixed(2)}</div>
          <b>Total: S/ ${comp.total.toFixed(2)}</b>
        </div>
        <div style="margin-top:13px;display:flex;gap:20px;align-items:center">
          <div>
            <img src="${qrSrc}" style="width:90px"/>
          </div>
          <div style="font-size:0.94em">
            Representación impresa de la boleta electrónica.<br>
            Puede consultar la boleta en <b>www.insage.com</b><br>
            Autorizado mediante resolución 034-005-0007241.
          </div>
        </div>
        <div style="margin-top:9px;font-size:0.94em">Forma de pago: Efectivo</div>
        <div style="margin-top:3px;font-size:0.97em">SON: ${montoLetras(comp.total)} SOLES</div>
        <div style="text-align:center;margin-top:13px">
          <button onclick="window.print()" style="font-size:1.1em;padding:8px 18px">Imprimir</button>
          <button onclick="descargarPDF()" style="font-size:1.1em;padding:8px 18px">Descargar PDF</button>
          <button onclick="document.getElementById('comprobantePreview').style.display='none'"
            style="font-size:1.1em;padding:8px 18px;background:#d33">Cerrar</button>
        </div>
      </div>
    `;
  } else {
    // NOTA DE VENTA: solo nombre empresa, productos, total, fecha, sin QR ni textos legales
    html = `
      <div class="doc-preview" style="width:${esA4?'700px':'340px'};font-size:${esA4?'1em':'0.87em'}">
        <div style="text-align:center">
          <div style="font-size:1.6em;font-weight:700;color:#22bb77">MARACUYA TIENDAS SALUDABLES E.I.R.L</div>
          <div style="font-size:1.1em;font-weight:500;margin-top:7px">NOTA DE VENTA</div>
          <div style="font-size:1.02em">N° NV-${String(comp.num).padStart(8, '0')}</div>
        </div>
        <hr>
        <div style="font-size:0.97em;margin:9px 0">
          <b>Fecha:</b> ${comp.fecha}
        </div>
        <table style="width:100%;border-collapse:collapse;margin:14px 0 6px 0;font-size:0.97em">
          <thead><tr style="background:#e9e9e9">
            <th>Cant</th><th>Código</th><th>Descripción</th><th>P.Unit</th><th>Total</th>
          </tr></thead>
          <tbody>${prodRows}</tbody>
        </table>
        <div style="text-align:right;margin:10px 0 5px 0;font-size:1.08em">
          <b>Total: S/ ${comp.total.toFixed(2)}</b>
        </div>
        <div style="text-align:center;margin-top:13px">
          <button onclick="window.print()" style="font-size:1.1em;padding:8px 18px">Imprimir</button>
          <button onclick="descargarPDF()" style="font-size:1.1em;padding:8px 18px">Descargar PDF</button>
          <button onclick="document.getElementById('comprobantePreview').style.display='none'"
            style="font-size:1.1em;padding:8px 18px;background:#d33">Cerrar</button>
        </div>
      </div>
    `;
  }
  preview.innerHTML = html;
  preview.style.display = "flex";
}

window.descargarPDF = function() {
  window.print();
}
function ocultarPreview() {
  document.getElementById("comprobantePreview").style.display = "none";
}

/*********** QR generator ************/
function generarQrSunat() {
  let qr = new QRious({
    value: "https://www.sunat.gob.pe",
    size: 100
  });
  return qr.toDataURL();
}

/*********** Modal comprobantes anteriores ************/
function mostrarModalComprobantes() {
  let modal = document.getElementById("modalComprobantes");
  let list = document.getElementById("comprobantesList");
  list.innerHTML = "Cargando...";
  db.ref("comprobantes").once("value", snap => {
    let arr = [];
    snap.forEach(c => arr.push(c.val()));
    arr.sort((a,b)=>b.num-a.num);
    list.innerHTML = arr.map(c =>
      `<div style="border-bottom:1px solid #eee;padding:8px">
        <b>${c.tipo==="boleta"?"Boleta":"Nota"} N° ${c.tipo==="boleta"?"B":"NV"}-${String(c.num).padStart(8,'0')}</b>
        - ${c.fecha}<br>
        Cliente: ${c.cliente.nombre}, Total: S/ ${c.total.toFixed(2)}
        <button style="margin-left:9px" onclick='verComprobanteGuardado("${c.tipo}","${c.num}")'>Ver</button>
      </div>`
    ).join("");
    modal.style.display = "flex";
  });
}
function cerrarModalComprobantes() {
  document.getElementById("modalComprobantes").style.display = "none";
}
window.verComprobanteGuardado = function(tipo,num) {
  db.ref("comprobantes/"+tipo+"-"+String(num).padStart(8,'0')).once("value", snap => {
    mostrarPreviewComprobante(snap.val());
  });
}

/*********** Utilidades ************/
function montoLetras(num) {
  // Sencillo a letras, no para todos los números
  let unidades = ['CERO','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE','DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE'];
  let decenas = ['','','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
  if(num < 16) return unidades[Math.floor(num)];
  if(num < 100) {
    let d = Math.floor(num/10), u = num%10;
    return decenas[d] + (u>0? ' Y '+unidades[u]:'');

  }
  if(num < 1000) {
    let c = Math.floor(num/100);
    let resto = num%100;
    let cent = c==1?'CIEN':unidades[c]+'CIENTOS';
    return cent+' '+montoLetras(resto);
  }
  return num.toFixed(2).replace('.',' CON ');
}

/*** Cerrar modales al hacer click afuera ***/
window.onclick = function(event) {
  if(event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
}
