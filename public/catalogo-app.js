// ============================================
// AGENTE GWEN - CATÁLOGO PÚBLICO
// ============================================

// ===== CONFIGURACIÓN SUPABASE =====
const SUPABASE_URL = 'https://dbvvdvmrnakpqggxpwrg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidnZkdm1ybmFrcHFnZ3hwd3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Nzc2MjIsImV4cCI6MjA5MzE1MzYyMn0.Bpm6rDQcYrbvqLyM-DAQfumjlKtdVL2qVqPgt42OG68';

// ===== DATOS DE PROYECTOS (CON COVER ARTS) =====
const coverArtsMapping = {
    "Tus Brazos": "Tus Brazos.JPG",
    "Solo Otra Vez": "Solo Otra Vez.png",
    "PRIMITIVO (Primavera)": "PRIMITIVO (Primavera).png",
    "Dios y Yo": "Dios y Yo.png",
    "La Ciudad de Los Vientos": "La Ciudad de los Vientos.jpg",
    "Mateo": "Mateo.png",
    "La Silbaora": "Portada la silbaora.jpg",
    "MARMOL (Invierno)": "MARMOL (Invierno).png",
    "Siempre a Ti": "Siempre a Ti.png"
};

const COVER_ARTS_PATH = './cover-arts/';

const spotifyIds = {
    "Tus Brazos": "1UzH8nd74uk3SsYMigISuj",
    "Solo Otra Vez": "0kyFOrOigzJe6e8YEuywkd",
    "PRIMITIVO (Primavera)": "79SV9FKNsHJZ59GQ1GbmIC",
    "Dios y Yo": "1Ei5c2GshPH8tC60h7YhUo",
    "La Ciudad de Los Vientos": "1cAwyRXZZLjfTpGPdXroIv",
    "Mateo": "5sItxqQUQFpFO9rB5ZJ6kr",
    "La Silbaora": "0LPUTxHF3Aq73pt7SWTgrQ",
    "MARMOL (Invierno)": "4aHsB4QJKUL4yU1g81jWG3",
    "Siempre a Ti": "2c5pe9NDktIsI9D1E8F16k"
};

// ===== ESTADO DE FILTROS =====
let filtroServicio = "todos";
let filtroAnio = "todos";

// ===== CLIENTE SUPABASE SIMPLE =====
const supabase = {
    from: (table) => ({
        select: (columns = '*') => ({
            then: (callback) => {
                fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}`, {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then(res => res.json())
                .then(data => callback({ data, error: null }))
                .catch(err => callback({ data: null, error: err }));
            }
        })
    })
};

// ===== FUNCIONES PRINCIPALES =====

async function cargarProyectos() {
    const grid = document.getElementById('projects-grid');
    grid.innerHTML = '<div class="loading">Cargando proyectos...</div>';

    try {
        const { data: proyectos, error } = await supabase
            .from('proyectos')
            .select(`
                id,
                cliente_id,
                nombre_proyecto,
                codigo,
                precio_total,
                estado,
                estado_vital,
                genero,
                anio,
                servicios,
                notas,
                spotify_track_id,
                clientes (nombre)
            `)
            .order('anio', { ascending: false });

        if (error) {
            console.error('Error Supabase:', error);
            throw error;
        }

        console.log('Proyectos cargados:', proyectos);
        renderProyectos(proyectos);
    } catch (error) {
        console.error('Error cargando proyectos:', error);
        grid.innerHTML = `
            <div class="no-results">
                <h3>Error al cargar</h3>
                <p>${error.message || 'No se pudieron cargar los proyectos. Intenta recargar la página.'}</p>
            </div>
        `;
    }
}

function renderProyectos(proyectos) {
    const grid = document.getElementById('projects-grid');

    // Filtrar proyectos
    const proyectosFiltrados = proyectos.filter(p => {
        const matchServicio = filtroServicio === "todos" ||
            (p.servicios && p.servicios.includes(filtroServicio));
        const matchAnio = filtroAnio === "todos" ||
            (p.anio && p.anio.toString() === filtroAnio);
        return matchServicio && matchAnio;
    });

    if (proyectosFiltrados.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <h3>No hay proyectos</h3>
                <p>No se encontraron proyectos con los filtros seleccionados.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = proyectosFiltrados.map(proyecto => {
        const cliente = proyecto.clientes?.nombre || 'Cliente';
        const nombreProyecto = proyecto.nombre_proyecto || 'Sin nombre';
        const coverArt = getCoverArt(nombreProyecto);
        const serviciosArray = parseServicios(proyecto.servicios);

        return `
            <div class="project-card" data-proyecto='${JSON.stringify(proyecto).replace(/'/g, "&apos;")}'>
                <div class="project-cover">
                    <img src="${coverArt}" alt="${nombreProyecto}">
                    <div class="project-overlay">
                        <div class="project-overlay-content">
                            <div class="project-overlay-title">${nombreProyecto}</div>
                            <div class="project-overlay-artist">${cliente}</div>
                        </div>
                    </div>
                </div>
                <div class="project-info">
                    <div class="project-title">${nombreProyecto}</div>
                    <div class="project-artist">${cliente}</div>
                    <div class="project-services">
                        ${serviciosArray.map(s => `<span class="service-tag">${s}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Agregar event listeners a las cards
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
            const proyecto = JSON.parse(card.dataset.proyecto);
            abrirModal(proyecto);
        });
    });
}

function getCoverArt(nombreProyecto) {
    // Buscar en el mapping
    for (const [key, filename] of Object.entries(coverArtsMapping)) {
        if (nombreProyecto.toLowerCase().includes(key.toLowerCase())) {
            return `${COVER_ARTS_PATH}${filename}`;
        }
    }
    // Cover art por defecto
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23c5b8aa" width="300" height="300"/%3E%3Ctext fill="%235e1c2e" font-family="Cormorant Garamond" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EDIECO MANCIPE%3C/text%3E%3C/svg%3E';
}

function parseServicios(serviciosStr) {
    if (!serviciosStr) return [];
    return serviciosStr.split(',').map(s => s.trim()).filter(s => s);
}

function getSpotifyId(nombreProyecto) {
    for (const [key, id] of Object.entries(spotifyIds)) {
        if (nombreProyecto.toLowerCase().includes(key.toLowerCase())) {
            return id;
        }
    }
    return null;
}

// ===== MODAL =====

function abrirModal(proyecto) {
    const modal = document.getElementById('modal-overlay');
    const cliente = proyecto.clientes?.nombre || 'Cliente';
    const nombreProyecto = proyecto.nombre_proyecto || 'Sin nombre';
    const coverArt = getCoverArt(nombreProyecto);
    const serviciosArray = parseServicios(proyecto.servicios);
    const spotifyId = getSpotifyId(nombreProyecto);

    document.getElementById('modal-cover-art').src = coverArt;
    document.getElementById('modal-title').textContent = nombreProyecto;
    document.getElementById('modal-artist').textContent = cliente;
    document.getElementById('modal-genero').textContent = proyecto.genero || 'Género';
    document.getElementById('modal-anio').textContent = proyecto.anio || 'Año';

    // Servicios
    const servicesContainer = document.getElementById('modal-services');
    if (serviciosArray.length > 0) {
        servicesContainer.innerHTML = `
            <div class="modal-services-label">Servicios:</div>
            <div class="modal-services-list">
                ${serviciosArray.map(s => `<span class="modal-service-item">${s}</span>`).join('')}
            </div>
        `;
        servicesContainer.style.display = 'block';
    } else {
        servicesContainer.style.display = 'none';
    }

    // Nota
    const noteContainer = document.getElementById('modal-note');
    if (proyecto.notas) {
        noteContainer.textContent = proyecto.notas;
        noteContainer.style.display = 'block';
    } else {
        noteContainer.style.display = 'none';
    }

    // Spotify Embed
    const spotifyContainer = document.getElementById('modal-spotify');
    if (spotifyId) {
        spotifyContainer.innerHTML = `
            <iframe
                src="https://open.spotify.com/embed/track/${spotifyId}"
                width="100%"
                height="152"
                frameBorder="0"
                allowfullscreen=""
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy">
            </iframe>
        `;
        spotifyContainer.style.display = 'block';
    } else {
        spotifyContainer.style.display = 'none';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    const modal = document.getElementById('modal-overlay');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Limpiar iframe de Spotify para detener audio
    document.getElementById('modal-spotify').innerHTML = '';
}

// ===== FILTROS =====

function setupFiltros() {
    // Filtros por servicio
    document.querySelectorAll('#servicio-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#servicio-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroServicio = btn.dataset.servicio;
            cargarProyectos();
        });
    });

    // Filtros por año
    document.querySelectorAll('#anio-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#anio-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroAnio = btn.dataset.anio;
            cargarProyectos();
        });
    });
}

// ===== INIT =====

document.addEventListener('DOMContentLoaded', () => {
    cargarProyectos();
    setupFiltros();

    // Modal close
    document.getElementById('modal-close').addEventListener('click', cerrarModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) cerrarModal();
    });

    // Close con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });
});
