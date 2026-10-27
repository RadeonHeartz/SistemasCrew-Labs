async function inventoryFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set(
    "X-CSRF-Token",
    document.querySelector('meta[name="csrf-token"]').content,
  );
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    location.assign("login.php");
    throw new Error("Tu sesión venció.");
  }
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "No se pudo completar la solicitud.");
  }
  return response;
}

let UltimoId = 0;
let action = "GUARDAR";
let form = document.querySelector("#equipoForm");
const tbody = document.querySelector("#inventarioTable tbody");

//Función flecha para devolver la url de la api
let API_RUTA = (controlador) => {
  return `api/admin/${controlador}.php`;
};

//Función para paginar la tabla
async function TablaPaginada() {
  const URL = API_RUTA("PaginasEquipos");
  try {
    const response = await inventoryFetch(URL);
    const datos = await response.json();
    const paginaciondiv = document.querySelector("#Paginacion");

    paginaciondiv.innerHTML = "";
    for (let pagina of datos.data) {
      paginaciondiv.innerHTML += `
        <button
          class="Paginador"
          id="Pagina${pagina.id_Pagina}"
          data-ultimo-id="${pagina.Ultimo_id_pagina}">
          ${pagina.id_Pagina}
        </button>
      `;
    }

    const paginasbtn = document.querySelectorAll(".Paginador");
    paginasbtn.forEach((boton) => {
      boton.addEventListener("click", () => {
        const ultimoId = boton.dataset.ultimoId;
        ObtenerEquipos(ultimoId);
      });
    });

    //Mostrar primera página siempre al iniciar
    ObtenerEquipos(0);
  } catch (error) {
    alert("Error al cargar los datos");
  }
}

//Función para mostrar los equipos y renderizarlos en la tabla
async function ObtenerEquipos(IdFinal = 0) {
  const URL = API_RUTA("Equipos");
  try {
    const response = await inventoryFetch(`${URL}?ultimo=${IdFinal}`);
    const datos = await response.json();
    const tabla = document.querySelector("#inventarioTable tbody");

    //Limpiar la tabla
    tabla.innerHTML = "";

    datos.data.forEach((equipo) => {
      let row = tabla.insertRow();
      const estado = String(equipo.Estado ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (estado) {
        row.classList.add(`${estado}`);
      }
      row.insertCell().textContent = equipo.Codigo;
      row.insertCell().textContent = equipo.Descripcion;
      row.insertCell().textContent = equipo.Categoria;
      row.insertCell().textContent = equipo.Estado;

      const celdaAccion = row.insertCell();
      const boton = document.createElement("button");

      boton.type = "button";
      boton.textContent = "Detalles";
      boton.classList.add("btn-preview");

      boton.addEventListener("click", () => {
        ObtenerPreview(equipo.Codigo);
      });
      celdaAccion.appendChild(boton);
    });
  } catch (error) {
    alert("Error al cargar los equipos");
  }
}

function MostrarDetallesEquipo(equipo) {
  const modal = document.querySelector("#ModalPreview");
  const contenedor = document.querySelector("#DetalleEquipo");

  contenedor.replaceChildren();

  Object.entries(equipo).forEach(([campo, valor]) => {
    const fila = document.createElement("p");
    const etiqueta = document.createElement("strong");
    const detalle = document.createElement("span");

    etiqueta.textContent = campo.replaceAll("_", " ") + ": ";
    detalle.textContent = valor ?? "No disponible";

    fila.append(etiqueta, detalle);
    contenedor.appendChild(fila);
  });

  modal.showModal();
}

function CerrarPreview() {
  document.querySelector("#ModalPreview").close();
}

async function ObtenerPreview(codigo) {
  const URL = API_RUTA("Equipos");
  try {
    const response = await inventoryFetch(
      `${URL}?codigo=${encodeURIComponent(codigo)}`,
    );

    const datos = await response.json();
    const equipo = datos.data;

    if (!equipo || Array.isArray(equipo)) {
      throw new Error("No se encontraron los detalles del equipo.");
    }

    MostrarDetallesEquipo(equipo);
  } catch (error) {
    alert("Error al consultar el equipo: " + error.message);
  }
}

async function ObtenerCategorias() {
  const API_URL_CATEGORIAS = API_RUTA("Categorias");
  try {
    const response = await inventoryFetch(API_URL_CATEGORIAS);
    const datos = await response.json();

    const selectCategoria = document.getElementById("categoria");

    datos.data.forEach((categoria) => {
      let option = document.createElement("option");

      option.value = categoria.Id_Categoria;
      option.textContent = categoria.Nombre_Categoria;

      selectCategoria.appendChild(option);
    });
  } catch (error) {
    alert("Error al conectar con la API:" + error);
  }
}

async function ObtenerUbicaciones() {
  const API_URL_UBICACIONES = API_RUTA("Ubicaciones");
  try {
    const response = await inventoryFetch(API_URL_UBICACIONES);
    const datos = await response.json();
    const ubicaciones = document.getElementById("ubicacion");

    datos.data.forEach((ubicacion) => {
      let option = document.createElement("option");
      option.value = ubicacion.Id_Ubicacion;
      option.textContent = ubicacion.Nombre_Ubicacion;
      ubicaciones.appendChild(option);
    });
  } catch (error) {
    alert("Error al conectar con la API:" + error);
  }
}

async function ObtenerEstadosEquipo() {
  const API_URL_ESTADOS = API_RUTA("Estados_Equipo");
  try {
    const response = await inventoryFetch(API_URL_ESTADOS);
    const datos = await response.json();
    const estados = document.getElementById("estado");
    datos.data.forEach((estado) => {
      let option = document.createElement("option");
      option.value = estado.id_estado_Equipo;
      option.textContent = estado.Nombre_Estado_Equipo;
      estados.appendChild(option);
    });
  } catch (error) {
    alert("Error al conectar con la API:" + error);
  }
}


function cargarModal() {
  form = document.querySelector("#equipoForm");

  const modal = document.querySelector("#ModalEquipos");
  const abrir = document.querySelector("#IngresarEquipo");
  const cerrar = document.querySelector("#cerrarModal");

  if (!form || !modal || !abrir || !cerrar) {
    console.error("No se encontraron todos los elementos del modal:", {
      form,
      modal,
      abrir,
      cerrar
    });
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (action === "GUARDAR") {
      await nuevoEquipo();
    } else {
      await editarEquipo();
    }
  });

  abrir.addEventListener("click", () => {
    modal.showModal();
  });

  cerrar.addEventListener("click", () => {
    form.reset();
    modal.close();
  });
}


async function nuevoEquipo() {
  const URL = API_RUTA("Equipos");
  try {
    const data = new FormData(form);
    try {
      const response = await inventoryFetch(URL, {
        method: "POST",
        body: data, //body: JSON.STRINGFY(data); Esto es para PUT
      });
      const result = await response.json();
      alert(result.message);
    } catch (error) {
      alert("Error al enviar el formulario:" + error);
    }
    form.reset();
    tbody.innerHTML = "";
    TablaPaginada();
  } catch (error) {
    alert("Error al insertar equipo, intente de nuevo");
    form.reset();
  }
}
async function editarEquipo() {
  return null;
}
