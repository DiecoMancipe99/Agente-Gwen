// ============================================
// AGENTE GWEN - CATÁLOGO PÚBLICO
// ============================================

// ===== CONFIGURACIÓN SUPABASE =====
const SUPABASE_URL = 'https://dbvvdvmrnakpqggxpwrg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidnZkdm1ybmFrcHFnZ3hwd3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Nzc2MjIsImV4cCI6MjA5MzE1MzYyMn0.Bpm6rDQcYrbvqLyM-DAQfumjlKtdVL2qVqPgt42OG68';

// ===== CONFIGURACIÓN =====
// Ahora usamos la tabla 'proyectos_musicales' separada de la financiera 'proyectos'
const TABLE_NAME = 'proyectos_musicales';
const COVER_ARTS_PATH = './cover-arts/';

// ===== ESTADO DE FILTROS =====
let filtroServicio = "todos";
let filtroAnio = "todos";

// ===== CLIENTE SUPABASE SIMPLE =====
function createSupabaseClient() {
    return {
        from: (table) => ({
            select: async function(columns = '*', filters = {}) {
                // Construir query params con filtros
                const params = new URLSearchParams();
                params.set('select', columns);

                // Agregar filtros (ej: activo=eq.true)
                Object.entries(filters).forEach(([key, value]) => {
                    params.set(key, `eq.${value}`);
                });

                const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

                try {
                    const res = await fetch(url, {
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    const data = await res.json();
                    return { data, error: null };
                } catch (err) {
                    return { data: null, error: err };
                }
            }
        })
    };
}

const supabase = createSupabaseClient();

// ===== FUNCIONES PRINCIPALES =====

async function cargarProyectos() {
    const grid = document.getElementById('projects-grid');
    grid.innerHTML = '<div class="loading">Cargando proyectos...</div>';

    try {
        // Filtros en la URL de Supabase
        const result = await supabase
            .from(TABLE_NAME)
            .select('*', { activo: true });

        const proyectos = result.data;
        const error = result.error;

        if (error) {
            console.error('Error Supabase:', error);
            throw error;
        }

        // Ordenar en JS (más simple que con Supabase REST)
        let proyectosOrdenados = (proyectos || []).sort((a, b) => {
            const anioDiff = (b.anio || 0) - (a.anio || 0);
            if (anioDiff !== 0) return anioDiff;
            return (a.orden || 0) - (b.orden || 0);
        });

        console.log('Proyectos musicales cargados:', proyectosOrdenados);
        renderProyectos(proyectosOrdenados);
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
        const titulo = proyecto.titulo || 'Sin título';
        const artista = proyecto.artista || 'Artista';
        const coverArt = getCoverArt(titulo);
        const serviciosArray = parseServicios(proyecto.servicios);

        return `
            <div class="project-card" data-proyecto='${JSON.stringify(proyecto).replace(/'/g, "&apos;")}'>
                <div class="project-cover">
                    <img src="${coverArt}" alt="${titulo}">
                    <div class="project-overlay">
                        <div class="project-overlay-content">
                            <div class="project-overlay-title">${titulo}</div>
                            <div class="project-overlay-artist">${artista}</div>
                        </div>
                    </div>
                </div>
                <div class="project-info">
                    <div class="project-title">${titulo}</div>
                    <div class="project-artist">${artista}</div>
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

function getCoverArt(titulo) {
    // Si el proyecto ya tiene cover_art en la BD, usarlo
    // Si no, usar cover por defecto
    if (titulo && titulo.cover_art) {
        return titulo.cover_art.startsWith('./') ? titulo.cover_art : `${COVER_ARTS_PATH}${titulo.cover_art}`;
    }
    // Cover art por defecto
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23c5b8aa" width="300" height="300"/%3E%3Ctext fill="%235e1c2e" font-family="Cormorant Garamond" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EDIECO MANCIPE%3C/text%3E%3C/svg%3E';
}

function parseServicios(serviciosStr) {
    if (!serviciosStr) return [];
    return serviciosStr.split(',').map(s => s.trim()).filter(s => s);
}

// ===== MODAL =====

function abrirModal(proyecto) {
    const modal = document.getElementById('modal-overlay');
    const titulo = proyecto.titulo || 'Sin título';
    const artista = proyecto.artista || 'Artista';
    const coverArt = proyecto.cover_art || getCoverArt(titulo);
    const serviciosArray = parseServicios(proyecto.servicios);
    const spotifyId = proyecto.spotify_track_id;

    document.getElementById('modal-cover-art').src = coverArt;
    document.getElementById('modal-title').textContent = titulo;
    document.getElementById('modal-artist').textContent = artista;
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
