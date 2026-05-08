/**
 * Agente Gwen - Aplicación Web
 * Conexión a Supabase y lógica de la interfaz
 */

// ===== CONFIGURACIÓN SUPABASE =====
const SUPABASE_URL = 'https://dbvvdvmrnakpqggxpwrg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidnZkdm1ybmFrcHFnZ3hwd3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Nzc2MjIsImV4cCI6MjA5MzE1MzYyMn0.Bpm6rDQcYrbvqLyM-DAQfumjlKtdVL2qVqPgt42OG68';

// ===== STATE =====
let currentUser = null;
let currentSection = 'dashboard';

// ===== SUPABASE CLIENT =====
const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function createSupabaseClient(url, key) {
    // Helper para obtener headers con token de autenticación
    const getHeaders = () => {
        const session = JSON.parse(localStorage.getItem('supabase_session') || 'null');
        const token = session?.access_token || key;
        return {
            'apikey': key,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    return {
        from: (table) => ({
            select: (columns = '*') => ({
                then: (callback) => {
                    fetch(`${url}/rest/v1/${table}?select=${columns}`, {
                        headers: getHeaders()
                    })
                    .then(res => res.json())
                    .then(data => callback({ data, error: null }))
                    .catch(err => callback({ data: null, error: err }));
                }
            }),
            insert: (data) => ({
                then: (callback) => {
                    fetch(`${url}/rest/v1/${table}`, {
                        method: 'POST',
                        headers: {
                            ...getHeaders(),
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(data)
                    })
                    .then(res => res.json())
                    .then(result => callback({ data: result, error: null }))
                    .catch(err => callback({ data: null, error: err }));
                }
            }),
            update: (data) => ({
                eq: (column, value) => ({
                    then: (callback) => {
                        fetch(`${url}/rest/v1/${table}?${column}=eq.${value}`, {
                            method: 'PATCH',
                            headers: {
                                ...getHeaders(),
                                'Prefer': 'return=representation'
                            },
                            body: JSON.stringify(data)
                        })
                        .then(res => res.json())
                        .then(result => callback({ data: result, error: null }))
                        .catch(err => callback({ data: null, error: err }));
                    }
                })
            }),
            delete: () => ({
                eq: (column, value) => ({
                    then: (callback) => {
                        fetch(`${url}/rest/v1/${table}?${column}=eq.${value}`, {
                            method: 'DELETE',
                            headers: {
                                ...getHeaders(),
                                'Prefer': 'return=representation'
                            }
                        })
                        .then(res => res.json())
                        .then(result => callback({ data: result, error: null }))
                        .catch(err => callback({ data: null, error: err }));
                    }
                })
            })
        }),
        auth: {
            signUp: (credentials) => {
                return fetch(`${url}/auth/v1/signup`, {
                    method: 'POST',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(credentials)
                }).then(res => res.json());
            },
            signInWithPassword: (credentials) => {
                return fetch(`${url}/auth/v1/token?grant_type=password`, {
                    method: 'POST',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(credentials)
                }).then(res => res.json());
            },
            signOut: () => {
                return fetch(`${url}/auth/v1/logout`, {
                    method: 'POST',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`
                    }
                });
            },
            getSession: () => {
                const session = localStorage.getItem('supabase_session');
                return session ? JSON.parse(session) : null;
            },
            setSession: (session) => {
                localStorage.setItem('supabase_session', JSON.stringify(session));
            },
            clearSession: () => {
                localStorage.removeItem('supabase_session');
            }
        }
    };
}

// ===== AUTH =====
async function checkAuth() {
    const session = supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        showApp();
        await loadDashboard();
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    console.log('[LOGIN] Intentando login con email:', document.getElementById('email').value);

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    try {
        console.log('[LOGIN] Llamando a Supabase auth...');
        const response = await supabase.auth.signInWithPassword({ email, password });

        console.log('[LOGIN] Respuesta recibida - keys:', Object.keys(response));
        console.log('[LOGIN] Respuesta completa:', JSON.stringify(response, null, 2));

        // Supabase puede retornar error directamente en la respuesta
        if (response.error) {
            console.error('[LOGIN] Error de Supabase:', response.error);
            errorEl.textContent = response.error.message || 'Error al iniciar sesión';
            return;
        }

        // La respuesta exitosa viene con user y los datos de sesión
        if (response.user) {
            console.log('[LOGIN] Login exitoso, guardando sesión...');
            // Guardamos el token y user en localStorage
            supabase.auth.setSession({
                access_token: response.access_token,
                refresh_token: response.refresh_token,
                expires_at: response.expires_at,
                user: response.user
            });
            currentUser = response.user;
            errorEl.textContent = '';
            showApp();
            await loadDashboard();
        } else {
            console.error('[LOGIN] Login no retornó user:', response);
            errorEl.textContent = 'Respuesta inválida del servidor';
        }
    } catch (err) {
        console.error('[LOGIN] Excepción:', err);
        errorEl.textContent = 'Error de conexión. Intentá de nuevo.';
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    supabase.auth.clearSession();
    currentUser = null;
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
}

function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    updateDateTime();
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-datetime').textContent =
        now.toLocaleString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
}

// ===== NAVIGATION =====
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            navigateTo(section);
        });
    });

    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

function navigateTo(section) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === section);
    });

    // Update sections
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.toggle('active', sec.id === `section-${section}`);
    });

    currentSection = section;

    // Load section data
    loadSectionData(section);
}

async function loadSectionData(section) {
    switch(section) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'clientes':
            await loadClientesLista();
            break;
        case 'ingresos':
            await loadClientesSelect('ingreso-cliente');
            await loadProyectosSelect('ingreso-proyecto');
            document.getElementById('ingreso-fecha').valueAsDate = new Date();
            break;
        case 'gastos':
            document.getElementById('gasto-fecha').valueAsDate = new Date();
            break;
        case 'gestionar':
            await loadIngresosLista();
            await loadGastosLista();
            break;
        case 'proyectos':
            await loadClientesSelect('proyecto-cliente');
            await loadProyectosTabla();
            break;
        case 'deudas':
            await loadDeudasLista();
            break;
        case 'sesiones':
            await loadClientesSelect('sesion-cliente');
            await loadSesionesTabla();
            document.getElementById('sesion-fecha').valueAsDate = new Date();
            break;
        case 'resumen':
            await loadResumenMensual();
            break;
        case 'reportes':
            await loadReporteProyectos();
            await loadFlujoCaja();
            break;
    }
}

// ===== DASHBOARD =====
async function loadDashboard() {
    await loadBalanceGeneral();
    await loadGastosPorCategoria();
    await loadUltimosMovimientos();
}

async function loadBalanceGeneral() {
    const { data: ingresos } = await supabase.from('ingresos').select('monto');
    const { data: gastos } = await supabase.from('gastos').select('monto');

    const totalIngresos = (ingresos || []).reduce((sum, i) => sum + (parseFloat(i.monto) || 0), 0);
    const totalGastos = (gastos || []).reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
    const balance = totalIngresos - totalGastos;

    // Sidebar
    document.getElementById('sidebar-balance').textContent = formatCurrency(balance);
    document.getElementById('sidebar-ingresos').textContent = `Ingresos: ${formatCurrency(totalIngresos)}`;
    document.getElementById('sidebar-gastos').textContent = `Gastos: ${formatCurrency(totalGastos)}`;

    // Dashboard
    document.getElementById('dash-total-ingresos').textContent = formatCurrency(totalIngresos);
    document.getElementById('dash-total-gastos').textContent = formatCurrency(totalGastos);
    document.getElementById('dash-balance').textContent = formatCurrency(balance);

    const deltaEl = document.getElementById('dash-delta');
    deltaEl.textContent = balance >= 0 ? '✓ Positivo' : '⚠ Negativo';
    deltaEl.className = 'metric-delta ' + (balance >= 0 ? 'positive' : 'negative');
}

async function loadGastosPorCategoria() {
    const { data: gastos } = await supabase.from('gastos').select('categoria, monto');

    if (!gastos || gastos.length === 0) {
        document.getElementById('gastos-categorias-chart').innerHTML = '<p style="opacity:0.6">No hay gastos registrados</p>';
        document.getElementById('gastos-categorias-table').innerHTML = '<p style="opacity:0.6">No hay gastos registrados</p>';
        return;
    }

    // Agrupar por categoría
    const categorias = {};
    gastos.forEach(g => {
        if (!categorias[g.categoria]) {
            categorias[g.categoria] = { total: 0, cantidad: 0 };
        }
        categorias[g.categoria].total += parseFloat(g.monto) || 0;
        categorias[g.categoria].cantidad++;
    });

    // Chart (simple bars)
    const chartEl = document.getElementById('gastos-categorias-chart');
    const sortedCats = Object.entries(categorias).sort((a, b) => b[1].total - a[1].total);
    const maxVal = Math.max(...sortedCats.map(c => c[1].total));

    chartEl.innerHTML = sortedCats.map(([cat, data]) => `
        <div style="margin-bottom: 0.75rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.7rem;margin-bottom:0.25rem;">
                <span>${cat}</span>
                <span>${formatCurrency(data.total)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(data.total / maxVal) * 100}%"></div>
            </div>
            <div style="font-size:0.65rem;opacity:0.6">${data.cantidad} registros</div>
        </div>
    `).join('');

    // Table
    const tableEl = document.getElementById('gastos-categorias-table');
    tableEl.innerHTML = `
        <thead>
            <tr><th>Categoría</th><th class="text-right">Total</th><th class="text-center">Cant.</th></tr>
        </thead>
        <tbody>
            ${sortedCats.map(([cat, data]) => `
                <tr>
                    <td>${cat}</td>
                    <td class="text-right">${formatCurrency(data.total)}</td>
                    <td class="text-center">${data.cantidad}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
}

async function loadUltimosMovimientos() {
    // Últimos ingresos
    const { data: ingresosResult } = await supabase.from('ingresos')
        .select('*, clientes(nombre), proyectos(nombre_proyecto)');
    const ingresos = (ingresosResult || []).slice(0, 5);

    const ingEl = document.getElementById('ultimos-ingresos');
    if (ingresos && ingresos.length > 0) {
        ingEl.innerHTML = ingresos.map(i => `
            <div class="movimiento-item">
                <div class="movimiento-header">${i.clientes?.nombre || 'Cliente'}</div>
                <div class="movimiento-detail">${formatCurrency(i.monto)} | ${i.fecha}</div>
                <div class="movimiento-detail">${i.metodo_pago || 'N/A'}</div>
            </div>
        `).join('');
    } else {
        ingEl.innerHTML = '<p style="opacity:0.6">No hay ingresos registrados</p>';
    }

    // Últimos gastos
    const { data: gastosResult } = await supabase.from('gastos').select('*');
    const gastos = (gastosResult || []).slice(0, 5);

    const gasEl = document.getElementById('ultimos-gastos');
    if (gastos && gastos.length > 0) {
        gasEl.innerHTML = gastos.map(g => `
            <div class="movimiento-item">
                <div class="movimiento-header">${g.categoria}</div>
                <div class="movimiento-detail">${formatCurrency(g.monto)} | ${g.fecha}</div>
                <div class="movimiento-detail">${g.descripcion?.substring(0, 30) || ''}${g.descripcion?.length > 30 ? '...' : ''}</div>
            </div>
        `).join('');
    } else {
        gasEl.innerHTML = '<p style="opacity:0.6">No hay gastos registrados</p>';
    }
}

// ===== CLIENTES =====
async function loadClientesSelect(selectId) {
    const { data: clientes, error } = await supabase.from('clientes').select('*');
    const select = document.getElementById(selectId);

    const existingOptions = select.querySelectorAll('option:not([value=""])');
    existingOptions.forEach(opt => opt.remove());

    if (error) {
        console.error('Error loading clientes:', error);
        return;
    }

    if (clientes && Array.isArray(clientes)) {
        clientes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nombre;
            select.appendChild(opt);
        });
    }
}

async function createCliente(nombre) {
    const { data, error } = await supabase.from('clientes').insert({ nombre });
    if (error) throw new Error('Error al crear cliente: ' + error.message);
    return data?.[0] || data;
}

// ===== CLIENTES =====

// Generar iniciales únicas para un cliente, evitando colisiones con otros
function generarInicialesUnicas(nombre, todosLosNombres, index) {
    const nombreLimpio = nombre.replace(/\s+/g, '').toUpperCase();

    // Intentar con 3, 4, 5 letras hasta encontrar una única
    for (let longitud = 3; longitud <= Math.min(5, nombreLimpio.length); longitud++) {
        const iniciales = nombreLimpio.substring(0, longitud);

        // Verificar si otro cliente tiene las mismas iniciales
        let hayColision = false;
        for (let i = 0; i < todosLosNombres.length; i++) {
            if (i === index) continue; // Saltar el mismo cliente

            const otroNombre = todosLosNombres[i].replace(/\s+/g, '').toUpperCase();
            const otrasIniciales = otroNombre.substring(0, longitud);

            if (iniciales === otrasIniciales) {
                hayColision = true;
                break;
            }
        }

        if (!hayColision) {
            return iniciales;
        }
    }

    // Si todo colisiona, devolver las primeras 3 letras (el número lo diferenciará)
    return nombreLimpio.substring(0, 3);
}

async function loadClientesLista() {
    const { data: clientes, error } = await supabase.from('clientes').select('*');
    const container = document.getElementById('lista-clientes');

    if (error) {
        console.error('Error loading clientes:', error);
        container.innerHTML = '<p style="opacity:0.6">Error al cargar clientes</p>';
        return;
    }

    if (!clientes || !Array.isArray(clientes) || clientes.length === 0) {
        container.innerHTML = '<p style="opacity:0.6">No hay clientes registrados</p>';
        return;
    }

    // Ordenar por fecha de creación (más recientes primero)
    clientes.sort((a, b) => {
        const dateA = new Date(a.creado_en || 0);
        const dateB = new Date(b.creado_en || 0);
        return dateB - dateA;
    });

    // Extraer todos los nombres para detectar colisiones
    const todosLosNombres = clientes.map(c => c.nombre);

    // Generar código con formato: DM-XXX-CLI-001 (con iniciales únicas)
    container.innerHTML = clientes.map((c, index) => {
        const iniciales = generarInicialesUnicas(c.nombre, todosLosNombres, index);
        const consecutivo = String(index + 1).padStart(3, '0');
        const codigoCorto = `DM-${iniciales}-CLI-${consecutivo}`;
        return `
        <div class="cliente-item">
            <div class="cliente-header">
                <span class="cliente-codigo">${codigoCorto}</span>
                <h4>${c.nombre}</h4>
            </div>
            <div class="cliente-detalles">
                ${c.contacto_email ? `<span>📧 ${c.contacto_email}</span>` : ''}
                ${c.contacto_telefono ? `<span>📱 ${c.contacto_telefono}</span>` : ''}
            </div>
            <div class="cliente-actions">
                <button class="btn-delete" onclick="deleteCliente('${c.id}')">Eliminar</button>
            </div>
        </div>
        `;
    }).join('');
}

async function handleClienteSubmit(e) {
    e.preventDefault();

    const nombre = document.getElementById('cliente-nombre').value.trim();
    const email = document.getElementById('cliente-email').value.trim();
    const telefono = document.getElementById('cliente-telefono').value.trim();

    if (!nombre) {
        alert('El nombre es obligatorio');
        return;
    }

    const cliente = {
        nombre: nombre,
        contacto_email: email || null,
        contacto_telefono: telefono || null
    };

    const { data, error } = await supabase.from('clientes').insert(cliente);

    if (error) {
        alert('Error al crear cliente: ' + error.message);
        return;
    }

    document.getElementById('cliente-success').textContent = `✅ Cliente '${nombre}' creado exitosamente`;
    document.getElementById('form-cliente').reset();
    await loadClientesLista();
    await loadClientesSelect('ingreso-cliente');
    await loadClientesSelect('sesion-cliente');
    await loadClientesSelect('proyecto-cliente');

    setTimeout(() => {
        document.getElementById('cliente-success').textContent = '';
    }, 3000);
}

async function deleteCliente(id) {
    if (!confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
        return;
    }

    const { error } = await supabase.from('clientes').delete().eq('id', id);

    if (error) {
        alert('Error al eliminar: ' + error.message);
        return;
    }

    await loadClientesLista();
    await loadClientesSelect('ingreso-cliente');
    await loadClientesSelect('sesion-cliente');
    await loadClientesSelect('proyecto-cliente');
}

// ===== PROYECTOS =====
async function loadProyectosSelect(selectId) {
    const { data: proyectos } = await supabase.from('proyectos')
        .select('*, clientes(nombre)');

    const select = document.getElementById(selectId);

    const existingOptions = select.querySelectorAll('option:not([value=""])');
    existingOptions.forEach(opt => opt.remove());

    if (proyectos) {
        proyectos.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.clientes?.nombre} - ${p.nombre_proyecto}`;
            select.appendChild(opt);
        });
    }
}

async function loadProyectosTabla() {
    const { data: proyectos } = await supabase.from('proyectos')
        .select('*, clientes(nombre)');

    const tableEl = document.getElementById('proyectos-table');

    if (!proyectos || proyectos.length === 0) {
        tableEl.innerHTML = '<p style="opacity:0.6">No hay proyectos registrados</p>';
        return;
    }

    // Calcular pagado por proyecto
    const pagadosPorProyecto = {};
    const { data: ingresos } = await supabase.from('ingresos').select('proyecto_id, monto');
    if (ingresos) {
        ingresos.forEach(i => {
            if (i.proyecto_id) {
                pagadosPorProyecto[i.proyecto_id] = (pagadosPorProyecto[i.proyecto_id] || 0) + parseFloat(i.monto);
            }
        });
    }

    let pagados = 0, parciales = 0, pendientes = 0;

    tableEl.innerHTML = `
        <thead>
            <tr>
                <th>Cliente</th>
                <th>Proyecto</th>
                <th class="text-right">Precio Total</th>
                <th class="text-right">Pagado</th>
                <th class="text-right">Debe</th>
                <th>Estado</th>
                <th>Estatus</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            ${proyectos.map(p => {
                const pagado = pagadosPorProyecto[p.id] || 0;
                const debe = (p.precio_total || 0) - pagado;
                let estado = 'Pendiente';
                if (debe <= 0) estado = 'Pagado';
                else if (pagado > 0) estado = 'Parcial';

                if (estado === 'Pagado') pagados++;
                else if (estado === 'Parcial') parciales++;
                else pendientes++;

                return `
                    <tr>
                        <td>${p.clientes?.nombre || 'N/A'}</td>
                        <td>${p.nombre_proyecto}</td>
                        <td class="text-right">${formatCurrency(p.precio_total)}</td>
                        <td class="text-right">${formatCurrency(pagado)}</td>
                        <td class="text-right">${formatCurrency(debe)}</td>
                        <td><span class="deuda-badge ${estado.toLowerCase()}">${estado}</span></td>
                        <td>
                            <select onchange="cambiarEstatusProyecto('${p.id}', this.value)" style="font-size:0.7rem;padding:0.25rem;border:1px solid rgba(94,28,46,0.3);border-radius:4px;background:transparent;">
                                <option value="">-</option>
                                <option value="Grabación" ${p.estatus === 'Grabación' ? 'selected' : ''}>Grabación</option>
                                <option value="Producción" ${p.estatus === 'Producción' ? 'selected' : ''}>Producción</option>
                                <option value="Mezcla" ${p.estatus === 'Mezcla' ? 'selected' : ''}>Mezcla</option>
                                <option value="Master" ${p.estatus === 'Master' ? 'selected' : ''}>Master</option>
                                <option value="RELEASE" ${p.estatus === 'RELEASE' ? 'selected' : ''}>RELEASE</option>
                            </select>
                        </td>
                        <td>
                            <button class="btn-secondary" onclick="generarFacturaProyecto('${p.id}')" style="font-size:0.65rem;padding:0.25rem 0.5rem;">📄 Generar</button>
                            <button class="btn-secondary" onclick="eliminarProyecto('${p.id}')" style="font-size:0.65rem;padding:0.25rem 0.5rem;margin-left:0.25rem;">🗑️ Eliminar</button>
                        </td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;

    document.getElementById('proy-pagados').textContent = pagados;
    document.getElementById('proy-parciales').textContent = parciales;
    document.getElementById('proy-pendientes').textContent = pendientes;
}

// ===== INGRESOS =====
async function handleIngresoSubmit(e) {
    e.preventDefault();

    const clienteSelect = document.getElementById('ingreso-cliente');
    const nuevoClienteInput = document.getElementById('nuevo-cliente-ingreso');
    const proyectoSelect = document.getElementById('ingreso-proyecto');

    let clienteId = clienteSelect.value;

    // Crear nuevo cliente si es necesario
    if (!clienteId && nuevoClienteInput.value.trim()) {
        const nuevoCliente = await createCliente(nuevoClienteInput.value.trim());
        clienteId = nuevoCliente.id;
    }

    if (!clienteId) {
        alert('Debes seleccionar o crear un cliente');
        return;
    }

    const ingreso = {
        proyecto_id: proyectoSelect.value || null,
        cliente_id: clienteId,
        fecha: document.getElementById('ingreso-fecha').value,
        monto: parseFloat(document.getElementById('ingreso-monto').value),
        metodo_pago: document.getElementById('ingreso-metodo').value,
        referencia: document.getElementById('ingreso-referencia').value,
        notas: document.getElementById('ingreso-notas').value
    };

    const { data: result, error } = await supabase.from('ingresos').insert(ingreso);

    if (error) {
        alert('Error al registrar: ' + error.message);
        return;
    }

    document.getElementById('ingreso-success').textContent = '✅ Ingreso registrado correctamente';
    document.getElementById('form-ingreso').reset();
    document.getElementById('ingreso-fecha').valueAsDate = new Date();

    setTimeout(() => {
        document.getElementById('ingreso-success').textContent = '';
    }, 3000);

    // Recargar dashboard
    if (currentSection === 'dashboard') {
        await loadDashboard();
    }
}

// ===== GASTOS =====
const categoriasGastos = [
    'Equipamiento', 'Servicios', 'Impuestos', 'Comida',
    'Transporte', 'Ocio', 'Imprevistos', 'Salud', 'Casa',
    'Educacion', 'Software', 'Estudio', 'Marketing', 'Viajes'
];

async function handleGastoSubmit(e) {
    e.preventDefault();

    const gasto = {
        fecha: document.getElementById('gasto-fecha').value,
        monto: parseFloat(document.getElementById('gasto-monto').value),
        categoria: document.getElementById('gasto-categoria').value,
        descripcion: document.getElementById('gasto-descripcion').value,
        proveedor: document.getElementById('gasto-proveedor').value,
        metodo_pago: document.getElementById('gasto-metodo').value,
        referencia: document.getElementById('gasto-referencia').value
    };

    const { data: result, error } = await supabase.from('gastos').insert(gasto);

    if (error) {
        alert('Error al registrar: ' + error.message);
        return;
    }

    document.getElementById('gasto-success').textContent = '✅ Gasto registrado correctamente';
    document.getElementById('form-gasto').reset();
    document.getElementById('gasto-fecha').valueAsDate = new Date();
    document.getElementById('gasto-ia-sugerencia').textContent = '';

    setTimeout(() => {
        document.getElementById('gasto-success').textContent = '';
    }, 3000);

    if (currentSection === 'dashboard') {
        await loadDashboard();
    }
}

function sugerirCategoriaGasto(descripcion) {
    const desc = descripcion.toLowerCase();
    const sugerenciasEl = document.getElementById('gasto-ia-sugerencia');

    // Buscar patrones simples
    const patrones = {
        'Equipamiento': ['cable', 'micrófono', 'parlante', 'auricular', 'interfaz', 'monitor', 'teclado', 'midi', 'stand', 'soporte'],
        'Software': ['plugin', 'licencia', 'suscripción', 'software', 'daw', 'ableton', 'logic', 'pro tools'],
        'Servicios': ['internet', 'luz', 'agua', 'alquiler', 'mantenimiento', 'reparación'],
        'Transporte': ['uber', 'taxi', 'gasolina', 'parquímetro', 'pasaje'],
        'Comida': ['restaurante', 'comida', 'almuerzo', 'cena', 'desayuno', 'mercado'],
        'Marketing': ['instagram', 'facebook', 'google ads', 'publicidad', 'flyer']
    };

    for (const [categoria, palabras] of Object.entries(patrones)) {
        if (palabras.some(p => desc.includes(p))) {
            sugerenciasEl.textContent = `💡 Sugerencia: ${categoria}`;
            document.getElementById('gasto-categoria').value = categoria;
            return;
        }
    }

    sugerenciasEl.textContent = '';
}

// ===== RESUMEN MENSUAL =====
let mesActual = new Date();

function cambiarMes(delta) {
    mesActual.setMonth(mesActual.getMonth() + delta);
    loadResumenMensual();
}

async function loadResumenMensual() {
    const year = mesActual.getFullYear();
    const month = mesActual.getMonth(); // 0-11

    // Actualizar título
    const mesNombre = mesActual.toLocaleString('es-CO', { month: 'long', year: 'numeric' });
    document.getElementById('resumen-mes-titulo').textContent = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);

    // Obtener datos del mes
    const mesStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    const { data: ingresosData } = await supabase.from('ingresos')
        .select('*, clientes(nombre), proyectos(nombre_proyecto)');
    const { data: gastosData } = await supabase.from('gastos').select('*');

    // Filtrar por mes
    const ingresos = (ingresosData || []).filter(i => i.fecha?.startsWith(mesStr));
    const gastos = (gastosData || []).filter(g => g.fecha?.startsWith(mesStr));

    // Calcular totales
    const totalIngresos = ingresos.reduce((sum, i) => sum + (parseFloat(i.monto) || 0), 0);
    const totalGastos = gastos.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
    const balance = totalIngresos - totalGastos;

    // Actualizar cards
    document.getElementById('resumen-ingresos').textContent = formatCurrency(totalIngresos);
    document.getElementById('resumen-gastos').textContent = formatCurrency(totalGastos);

    const balanceEl = document.getElementById('resumen-balance');
    balanceEl.textContent = formatCurrency(balance);
    balanceEl.style.color = balance >= 0 ? '#2d6a4f' : '#c41e3a';

    // Renderizar listas
    const ingresosLista = document.getElementById('resumen-ingresos-lista');
    if (ingresos.length > 0) {
        ingresosLista.innerHTML = ingresos.map(i => `
            <div style="display:flex;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid rgba(94,28,46,0.1);">
                <div>
                    <div style="font-weight:600;">${i.clientes?.nombre || 'Cliente'}</div>
                    <div style="font-size:0.75rem;opacity:0.7;">${i.proyectos?.nombre_proyecto || 'Sin proyecto'} | ${i.metodo_pago || 'N/A'}</div>
                </div>
                <div style="font-weight:600;color:var(--color-primary);">${formatCurrency(i.monto)}</div>
            </div>
        `).join('');
    } else {
        ingresosLista.innerHTML = '<p style="opacity:0.6;text-align:center;padding:1rem;">No hay ingresos este mes</p>';
    }

    const gastosLista = document.getElementById('resumen-gastos-lista');
    if (gastos.length > 0) {
        gastosLista.innerHTML = gastos.map(g => `
            <div style="display:flex;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid rgba(94,28,46,0.1);">
                <div>
                    <div style="font-weight:600;">${g.categoria}</div>
                    <div style="font-size:0.75rem;opacity:0.7;">${g.descripcion || 'Sin descripción'} | ${g.proveedor || 'N/A'}</div>
                </div>
                <div style="font-weight:600;color:var(--color-taupe);">${formatCurrency(g.monto)}</div>
            </div>
        `).join('');
    } else {
        gastosLista.innerHTML = '<p style="opacity:0.6;text-align:center;padding:1rem;">No hay gastos este mes</p>';
    }
}

// ===== GESTIONAR =====

// Funciones para cambiar orden
function cambiarOrdenIngresos(valor) {
    ordenIngresos = valor;
    loadIngresosLista();
}

function cambiarOrdenGastos(valor) {
    ordenGastos = valor;
    loadGastosLista();
}

function cambiarOrdenSesiones(valor) {
    ordenSesiones = valor;
    loadSesionesTabla();
}

// Funciones para búsqueda
function setupBuscadores() {
    // Buscador ingresos
    const buscadorIngresos = document.getElementById('buscador-ingresos');
    if (buscadorIngresos) {
        buscadorIngresos.addEventListener('input', (e) => {
            busquedaIngresos = e.target.value;
            loadIngresosLista();
        });
    }

    // Buscador gastos
    const buscadorGastos = document.getElementById('buscador-gastos');
    if (buscadorGastos) {
        buscadorGastos.addEventListener('input', (e) => {
            busquedaGastos = e.target.value;
            loadGastosLista();
        });
    }

    // Buscador sesiones
    const buscadorSesiones = document.getElementById('buscador-sesiones');
    if (buscadorSesiones) {
        buscadorSesiones.addEventListener('input', (e) => {
            busquedaSesiones = e.target.value;
            loadSesionesTabla();
        });
    }
}

// ===== GESTIONAR =====

async function loadIngresosLista() {
    const { data: ingresos } = await supabase.from('ingresos')
        .select('*, clientes(nombre), proyectos(nombre_proyecto)');

    const container = document.getElementById('lista-ingresos');

    if (!ingresos || ingresos.length === 0) {
        container.innerHTML = '<p style="opacity:0.6">No hay ingresos registrados</p>';
        return;
    }

    // Ordenar por fecha
    let ingresosOrdenados = [...ingresos].sort((a, b) => {
        const dateA = new Date(a.fecha || 0);
        const dateB = new Date(b.fecha || 0);
        return ordenIngresos === 'reciente' ? dateB - dateA : dateA - dateB;
    });

    // Filtrar por búsqueda
    if (busquedaIngresos) {
        const busqueda = busquedaIngresos.toLowerCase();
        ingresosOrdenados = ingresosOrdenados.filter(i =>
            i.clientes?.nombre?.toLowerCase().includes(busqueda) ||
            i.proyectos?.nombre_proyecto?.toLowerCase().includes(busqueda)
        );
    }

    container.innerHTML = ingresosOrdenados.map(i => `
        <div class="deuda-item">
            <div class="deuda-header">
                <h4>${i.clientes?.nombre || 'Cliente'} - ${formatCurrency(i.monto)}</h4>
                <span class="deuda-badge">${i.fecha}</span>
            </div>
            <div class="deuda-details">
                <div class="deuda-detail">
                    <div class="deuda-detail-label">Proyecto</div>
                    <div class="deuda-detail-value">${i.proyectos?.nombre_proyecto || 'N/A'}</div>
                </div>
                <div class="deuda-detail">
                    <div class="deuda-detail-label">Método</div>
                    <div class="deuda-detail-value">${i.metodo_pago || 'N/A'}</div>
                </div>
                <div class="deuda-detail">
                    <div class="deuda-detail-label">Referencia</div>
                    <div class="deuda-detail-value">${i.referencia || 'N/A'}</div>
                </div>
            </div>
            ${i.notas ? `<p style="font-size:0.75rem;margin-top:0.5rem"><strong>Notas:</strong> ${i.notas}</p>` : ''}
            <button class="btn-secondary" onclick="eliminarIngreso('${i.id}')" style="margin-top:1rem;font-size:0.65rem;">🗑️ Eliminar</button>
        </div>
    `).join('');
}

async function loadGastosLista() {
    const { data: gastos } = await supabase.from('gastos').select('*');

    const container = document.getElementById('lista-gastos');

    if (!gastos || gastos.length === 0) {
        container.innerHTML = '<p style="opacity:0.6">No hay gastos registrados</p>';
        return;
    }

    // Ordenar por fecha
    let gastosOrdenados = [...gastos].sort((a, b) => {
        const dateA = new Date(a.fecha || 0);
        const dateB = new Date(b.fecha || 0);
        return ordenGastos === 'reciente' ? dateB - dateA : dateA - dateB;
    });

    // Filtrar por búsqueda (descripcion o proveedor)
    if (busquedaGastos) {
        const busqueda = busquedaGastos.toLowerCase();
        gastosOrdenados = gastosOrdenados.filter(g =>
            g.descripcion?.toLowerCase().includes(busqueda) ||
            g.proveedor?.toLowerCase().includes(busqueda) ||
            g.categoria?.toLowerCase().includes(busqueda)
        );
    }

    container.innerHTML = gastosOrdenados.map(g => `
        <div class="deuda-item">
            <div class="deuda-header">
                <h4>${g.categoria} - ${formatCurrency(g.monto)}</h4>
                <span class="deuda-badge">${g.fecha}</span>
            </div>
            <div class="deuda-details">
                <div class="deuda-detail">
                    <div class="deuda-detail-label">Descripción</div>
                    <div class="deuda-detail-value">${g.descripcion || 'Sin descripción'}</div>
                </div>
                <div class="deuda-detail">
                    <div class="deuda-detail-label">Proveedor</div>
                    <div class="deuda-detail-value">${g.proveedor || 'N/A'}</div>
                </div>
                <div class="deuda-detail">
                    <div class="deuda-detail-label">Método</div>
                    <div class="deuda-detail-value">${g.metodo_pago || 'N/A'}</div>
                </div>
            </div>
            <button class="btn-secondary" onclick="eliminarGasto('${g.id}')" style="margin-top:1rem;font-size:0.65rem;">🗑️ Eliminar</button>
        </div>
    `).join('');
}

async function eliminarIngreso(id) {
    if (!confirm('¿Seguro que querés eliminar este ingreso?')) return;

    const { error } = await supabase.from('ingresos').delete().eq('id', id);
    if (error) {
        alert('Error al eliminar: ' + error.message);
        return;
    }
    await loadIngresosLista();
    if (currentSection === 'dashboard') await loadDashboard();
}

async function eliminarGasto(id) {
    if (!confirm('¿Seguro que querés eliminar este gasto?')) return;

    const { error } = await supabase.from('gastos').delete().eq('id', id);
    if (error) {
        alert('Error al eliminar: ' + error.message);
        return;
    }
    await loadGastosLista();
    if (currentSection === 'dashboard') await loadDashboard();
}

async function eliminarProyecto(id) {
    if (!confirm('¿Seguro que querés eliminar este proyecto?')) return;

    const { error } = await supabase.from('proyectos').delete().eq('id', id);
    if (error) {
        alert('Error al eliminar: ' + error.message);
        return;
    }
    await loadProyectosTabla();
}

async function cambiarEstatusProyecto(id, nuevoEstatus) {
    const { error } = await supabase.from('proyectos').update({ estatus: nuevoEstatus }).eq('id', id);
    if (error) {
        alert('Error al actualizar: ' + error.message);
        return;
    }
    // Feedback visual pequeño
    const select = event.target;
    select.style.borderColor = 'var(--color-primary)';
    setTimeout(() => {
        select.style.borderColor = 'rgba(94,28,46,0.3)';
    }, 1000);
}

async function eliminarDeuda(id) {
    if (!confirm('¿Seguro que querés eliminar esta deuda?')) return;

    const { error } = await supabase.from('deudas').delete().eq('id', id);
    if (error) {
        alert('Error al eliminar: ' + error.message);
        return;
    }
    await loadDeudasLista();
}

async function eliminarSesion(id) {
    if (!confirm('¿Seguro que querés eliminar esta sesión?')) return;

    const { error } = await supabase.from('sesiones').delete().eq('id', id);
    if (error) {
        alert('Error al eliminar: ' + error.message);
        return;
    }
    await loadSesionesTabla();
}

// ===== DEUDAS =====
async function loadDeudasLista() {
    const { data: deudas } = await supabase.from('deudas').select('*');
    const { data: pagos } = await supabase.from('pagos_deudas').select('*');

    const container = document.getElementById('lista-deudas');

    if (!deudas || deudas.length === 0) {
        container.innerHTML = '<p style="opacity:0.6">No hay deudas registradas</p>';
        return;
    }

    // Agrupar pagos por deuda
    const pagosPorDeuda = {};
    if (pagos) {
        pagos.forEach(p => {
            if (!pagosPorDeuda[p.deuda_id]) {
                pagosPorDeuda[p.deuda_id] = [];
            }
            pagosPorDeuda[p.deuda_id].push(p);
        });
    }

    container.innerHTML = deudas.map(d => {
        const saldo = (d.monto_total || 0) - (d.monto_pagado || 0);
        const estado = saldo <= 0 ? 'Pagada' : 'Pendiente';
        const pagosDeuda = pagosPorDeuda[d.id] || [];

        return `
            <div class="deuda-item">
                <div class="deuda-header">
                    <h4>${d.persona}</h4>
                    <span class="deuda-badge ${estado.toLowerCase()}">${estado}</span>
                    <button class="btn-secondary" onclick="eliminarDeuda('${d.id}')" style="font-size:0.65rem;padding:0.25rem 0.5rem;">🗑️ Eliminar</button>
                </div>
                <div class="deuda-details">
                    <div class="deuda-detail">
                        <div class="deuda-detail-label">Total</div>
                        <div class="deuda-detail-value">${formatCurrency(d.monto_total)}</div>
                    </div>
                    <div class="deuda-detail">
                        <div class="deuda-detail-label">Pagado</div>
                        <div class="deuda-detail-value">${formatCurrency(d.monto_pagado || 0)}</div>
                    </div>
                    <div class="deuda-detail">
                        <div class="deuda-detail-label">Saldo</div>
                        <div class="deuda-detail-value">${formatCurrency(saldo)}</div>
                    </div>
                </div>
                ${d.descripcion ? `<p style="font-size:0.75rem">${d.descripcion}</p>` : ''}

                ${estado === 'Pendiente' ? `
                    <div class="deuda-pagos">
                        <h5>Registrar Pago</h5>
                        <form onsubmit="registrarPagoDeuda('${d.id}', event)" style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                            <input type="number" name="monto" placeholder="Monto" min="0" step="0.01" style="flex:1;min-width:100px;padding:0.5rem;border:1px solid rgba(94,28,46,0.3);border-radius:4px;" required>
                            <input type="date" name="fecha" value="${new Date().toISOString().split('T')[0]}" style="padding:0.5rem;border:1px solid rgba(94,28,46,0.3);border-radius:4px;">
                            <button type="submit" class="btn-primary" style="padding:0.5rem 1rem;font-size:0.7rem;">Registrar</button>
                        </form>
                        ${pagosDeuda.length > 0 ? `
                            <div style="margin-top:0.75rem;max-height:100px;overflow-y:auto;">
                                ${pagosDeuda.map(p => `
                                    <div style="font-size:0.7rem;padding:0.25rem 0;border-bottom:1px solid rgba(94,28,46,0.05);">
                                        ${p.fecha}: ${formatCurrency(p.monto)} ${p.notas ? `- ${p.notas}` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

async function handleDeudaSubmit(e) {
    e.preventDefault();

    const deuda = {
        persona: document.getElementById('deuda-persona').value,
        monto_total: parseFloat(document.getElementById('deuda-monto').value),
        descripcion: document.getElementById('deuda-descripcion').value,
        fecha_vencimiento: document.getElementById('deuda-vencimiento').value || null,
        fecha_creacion: new Date().toISOString().split('T')[0]
    };

    const { data: result, error } = await supabase.from('deudas').insert(deuda);

    if (error) {
        alert('Error al crear deuda: ' + error.message);
        return;
    }

    document.getElementById('deuda-success').textContent = '✅ Deuda creada correctamente';
    document.getElementById('form-deuda').reset();
    await loadDeudasLista();

    setTimeout(() => {
        document.getElementById('deuda-success').textContent = '';
    }, 3000);
}

async function registrarPagoDeuda(deudaId, e) {
    e.preventDefault();
    const form = e.target;
    const monto = parseFloat(form.monto.value);
    const fecha = form.fecha.value;

    if (monto <= 0) return;

    // Registrar pago
    const { data: result, error } = await supabase.from('pagos_deudas').insert({
        deuda_id: deudaId,
        fecha,
        monto
    });

    if (error) {
        alert('Error al registrar pago: ' + error.message);
        return;
    }

    // Actualizar deuda - obtener todas y filtrar en JS (nuestro cliente no soporta .eq)
    const { data: todasDeudas } = await supabase.from('deudas').select('id, monto_pagado, monto_total');
    const deudaData = todasDeudas?.find(d => d.id === deudaId) || null;

    if (deudaData) {
        const nuevoPagado = (deudaData.monto_pagado || 0) + monto;
        const estado = nuevoPagado >= deudaData.monto_total ? 'Pagada' : 'Pendiente';

        // Actualizar usando fetch directo con filtro en URL
        const session = JSON.parse(localStorage.getItem('supabase_session') || 'null');
        const token = session?.access_token || SUPABASE_ANON_KEY;

        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/deudas?id=eq.${deudaId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                monto_pagado: nuevoPagado,
                estado
            })
        });

        if (updateResponse.status >= 400) {
            const errorData = await updateResponse.json();
            alert('Error al actualizar deuda: ' + (errorData.message || 'Error desconocido'));
            return;
        }
    }

    // Recargar la lista de deudas y quedarse en la sección
    await loadDeudasLista();

    // Limpiar formulario
    form.reset();
    form.fecha.value = new Date().toISOString().split('T')[0];
}

// ===== SESIONES =====
async function loadSesionesTabla() {
    const { data: sesiones } = await supabase.from('sesiones')
        .select('*, clientes(nombre), proyectos(nombre_proyecto)');

    const tableEl = document.getElementById('sesiones-table');

    if (!sesiones || sesiones.length === 0) {
        tableEl.innerHTML = '<p style="opacity:0.6">No hay sesiones registradas - ¡Comenzá de cero!</p>';
        return;
    }

    // Ordenar por fecha
    let sesionesOrdenadas = [...sesiones].sort((a, b) => {
        const dateA = new Date(a.fecha || 0);
        const dateB = new Date(b.fecha || 0);
        return ordenSesiones === 'reciente' ? dateB - dateA : dateA - dateB;
    });

    // Filtrar por búsqueda (cliente o proyecto)
    if (busquedaSesiones) {
        const busqueda = busquedaSesiones.toLowerCase();
        sesionesOrdenadas = sesionesOrdenadas.filter(s =>
            s.clientes?.nombre?.toLowerCase().includes(busqueda) ||
            s.proyectos?.nombre_proyecto?.toLowerCase().includes(busqueda)
        );
    }

    tableEl.innerHTML = `
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Proyecto</th>
                <th>Objetivo</th>
                <th>Estado</th>
                <th>Código</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            ${sesiones.map(s => `
                <tr>
                    <td>${s.fecha}</td>
                    <td>${s.clientes?.nombre || 'N/A'}</td>
                    <td>${s.proyectos?.nombre_proyecto || 'Sin proyecto'}</td>
                    <td>${s.objetivo || 'Sin objetivo'}</td>
                    <td>${s.estado || 'N/A'}</td>
                    <td>${s.codigo_sesion || 'N/A'}</td>
                    <td><button class="btn-secondary" onclick="eliminarSesion('${s.id}')" style="font-size:0.65rem;padding:0.25rem 0.5rem;">🗑️ Eliminar</button></td>
                </tr>
            `).join('')}
        </tbody>
    `;
}

async function handleSesionSubmit(e) {
    e.preventDefault();

    const clienteSelect = document.getElementById('sesion-cliente');
    const nuevoClienteInput = document.getElementById('nuevo-cliente-sesion');
    const proyectoSelect = document.getElementById('sesion-proyecto');

    let clienteId = clienteSelect.value;

    if (!clienteId && nuevoClienteInput.value.trim()) {
        const nuevoCliente = await createCliente(nuevoClienteInput.value.trim());
        clienteId = nuevoCliente.id;
    }

    if (!clienteId) {
        alert('Debes seleccionar o crear un cliente');
        return;
    }

    // Generar código de sesión
    const cliente = clienteSelect.options[clienteSelect.selectedIndex]?.text || nuevoClienteInput.value;
    const { data: sesionesCount } = await supabase.from('sesiones').select('id');
    const contador = (sesionesCount?.length || 0) + 1;
    const codigo = generarCodigoSesion(cliente, document.getElementById('sesion-objetivo').value || 'Sesion', contador);

    const sesion = {
        cliente_id: clienteId,
        proyecto_id: proyectoSelect.value || null,
        fecha: document.getElementById('sesion-fecha').value,
        objetivo: document.getElementById('sesion-objetivo').value,
        estado: document.getElementById('sesion-estado').value,
        comentarios: document.getElementById('sesion-comentarios').value,
        codigo_sesion: codigo
    };

    const { data: result, error } = await supabase.from('sesiones').insert(sesion);

    if (error) {
        alert('Error al crear sesión: ' + error.message);
        return;
    }

    document.getElementById('sesion-success').textContent = `✅ Sesión creada con código ${codigo}`;
    document.getElementById('form-sesion').reset();
    document.getElementById('sesion-fecha').valueAsDate = new Date();

    setTimeout(() => {
        document.getElementById('sesion-success').textContent = '';
    }, 3000);

    await loadSesionesTabla();
}

function generarCodigoSesion(clienteNombre, objetivo, contador) {
    const partes = clienteNombre.toUpperCase().split(' ');
    const iniciales = partes.length >= 2
        ? partes[0].substring(0, 2) + partes[1].substring(0, 2)
        : partes[0].substring(0, 4);

    const proyCode = objetivo.toUpperCase().split(' ')[0].substring(0, 3);

    return `DM-${proyCode}-${String(contador).padStart(2, '0')}-PT`;
}

// ===== REPORTES =====
async function loadReporteProyectos() {
    const { data: proyectos } = await supabase.from('proyectos')
        .select('*, clientes(nombre)');

    const { data: ingresos } = await supabase.from('ingresos').select('proyecto_id, monto');

    const pagadosPorProyecto = {};
    if (ingresos) {
        ingresos.forEach(i => {
            if (i.proyecto_id) {
                pagadosPorProyecto[i.proyecto_id] = (pagadosPorProyecto[i.proyecto_id] || 0) + parseFloat(i.monto);
            }
        });
    }

    const tableEl = document.getElementById('reporte-proyectos-table');

    if (!proyectos || proyectos.length === 0) {
        tableEl.innerHTML = '<p style="opacity:0.6">No hay proyectos registrados</p>';
        return;
    }

    tableEl.innerHTML = `
        <thead>
            <tr>
                <th>Cliente</th>
                <th>Proyecto</th>
                <th class="text-right">Precio</th>
                <th class="text-right">Pagado</th>
                <th class="text-right">Debe</th>
                <th>% Pagado</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            ${proyectos.map(p => {
                const pagado = pagadosPorProyecto[p.id] || 0;
                const debe = (p.precio_total || 0) - pagado;
                const porcentaje = p.precio_total > 0 ? (pagado / p.precio_total) * 100 : 0;
                let estado = 'Pendiente';
                if (debe <= 0) estado = 'Pagado';
                else if (pagado > 0) estado = 'Parcial';

                return `
                    <tr>
                        <td>${p.clientes?.nombre || 'N/A'}</td>
                        <td>${p.nombre_proyecto}</td>
                        <td class="text-right">${formatCurrency(p.precio_total)}</td>
                        <td class="text-right">${formatCurrency(pagado)}</td>
                        <td class="text-right">${formatCurrency(debe)}</td>
                        <td>
                            <div style="display:flex;align-items:center;gap:0.5rem;">
                                <div class="progress-bar" style="flex:1;margin:0;">
                                    <div class="progress-fill" style="width: ${Math.min(porcentaje, 100)}%"></div>
                                </div>
                                <span style="font-size:0.7rem">${porcentaje.toFixed(1)}%</span>
                            </div>
                        </td>
                        <td><span class="deuda-badge ${estado.toLowerCase()}">${estado}</span></td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;
}

async function loadFlujoCaja() {
    const { data: ingresos } = await supabase.from('ingresos').select('fecha, monto');
    const { data: gastos } = await supabase.from('gastos').select('fecha, monto');

    // Agrupar por mes
    const porMes = {};

    if (ingresos) {
        ingresos.forEach(i => {
            const mes = i.fecha.substring(0, 7); // YYYY-MM
            if (!porMes[mes]) porMes[mes] = { ingresos: 0, gastos: 0 };
            porMes[mes].ingresos += parseFloat(i.monto) || 0;
        });
    }

    if (gastos) {
        gastos.forEach(g => {
            const mes = g.fecha.substring(0, 7);
            if (!porMes[mes]) porMes[mes] = { ingresos: 0, gastos: 0 };
            porMes[mes].gastos += parseFloat(g.monto) || 0;
        });
    }

    const meses = Object.keys(porMes).sort().slice(-12);

    // Chart
    const chartEl = document.getElementById('flujo-caja-chart');
    if (meses.length === 0) {
        chartEl.innerHTML = '<p style="opacity:0.6">No hay datos suficientes</p>';
        return;
    }

    const maxVal = Math.max(...meses.map(m => Math.max(porMes[m].ingresos, porMes[m].gastos)), 1);

    chartEl.innerHTML = `
        <div style="display:flex;gap:1rem;align-items:flex-end;height:200px;padding:1rem;overflow-x:auto;">
            ${meses.map(m => {
                const d = porMes[m];
                const ingHeight = (d.ingresos / maxVal) * 100;
                const gasHeight = (d.gastos / maxVal) * 100;
                return `
                    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:0.25rem;">
                        <div style="flex:1;display:flex;align-items:flex-end;gap:2px;width:100%;">
                            <div style="flex:1;background:var(--color-primary);border-radius:2px 2px 0 0;height:${ingHeight}%;"></div>
                            <div style="flex:1;background:var(--color-taupe);border-radius:2px 2px 0 0;height:${gasHeight}%;"></div>
                        </div>
                        <div style="font-size:0.6rem;transform:rotate(-45deg);transform-origin:left;">${m.substring(5)}/${m.substring(2,4)}</div>
                    </div>
                `;
            }).join('')}
        </div>
        <div style="display:flex;gap:1rem;justify-content:center;margin-top:0.5rem;font-size:0.65rem;">
            <span><span style="display:inline-block;width:10px;height:10px;background:var(--color-primary);margin-right:0.25rem;"></span>Ingresos</span>
            <span><span style="display:inline-block;width:10px;height:10px;background:var(--color-taupe);margin-right:0.25rem;"></span>Gastos</span>
        </div>
    `;

    // Table
    const tableEl = document.getElementById('flujo-caja-table');
    tableEl.innerHTML = `
        <thead>
            <tr>
                <th>Mes</th>
                <th class="text-right">Ingresos</th>
                <th class="text-right">Gastos</th>
                <th class="text-right">Balance</th>
            </tr>
        </thead>
        <tbody>
            ${meses.reverse().map(m => {
                const d = porMes[m];
                const balance = d.ingresos - d.gastos;
                return `
                    <tr>
                        <td>${m.substring(5)}/${m.substring(2,4)}</td>
                        <td class="text-right">${formatCurrency(d.ingresos)}</td>
                        <td class="text-right">${formatCurrency(d.gastos)}</td>
                        <td class="text-right" style="color:${balance >= 0 ? '#2d6a4f' : '#c41e3a'}">${formatCurrency(balance)}</td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;
}

// ===== UTILS =====
function formatCurrency(amount) {
    return '$ ' + (amount || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ===== SETUP MODAL CLIENTE =====
function setupModalCliente() {
    const modal = document.getElementById('modal-cliente');
    let currentSelect = null;
    let currentGroup = null;

    document.getElementById('btn-nuevo-cliente-ingreso').addEventListener('click', () => {
        currentSelect = 'ingreso-cliente';
        currentGroup = 'nuevo-cliente-ingreso-group';
        document.getElementById(currentGroup).style.display = 'block';
    });

    document.getElementById('modal-cliente-cancel').addEventListener('click', () => {
        modal.classList.add('hidden');
        if (currentGroup) {
            document.getElementById(currentGroup).style.display = 'none';
        }
    });

    document.getElementById('modal-cliente-save').addEventListener('click', async () => {
        const nombre = document.getElementById('modal-cliente-nombre').value.trim();
        if (!nombre) return;

        try {
            const nuevoCliente = await createCliente(nombre);

            // Recargar selects
            await loadClientesSelect('ingreso-cliente');
            await loadClientesSelect('proyecto-cliente');
            await loadClientesSelect('sesion-cliente');

            // Seleccionar el nuevo cliente
            if (currentSelect) {
                document.getElementById(currentSelect).value = nuevoCliente.id;
            }

            modal.classList.add('hidden');
            if (currentGroup) {
                document.getElementById(currentGroup).style.display = 'none';
            }
            document.getElementById('modal-cliente-nombre').value = '';
        } catch (err) {
            alert('Error al crear cliente: ' + err.message);
        }
    });
}

// ===== PROYECTOS =====
async function handleProyectoSubmit(e) {
    e.preventDefault();

    const clienteSelect = document.getElementById('proyecto-cliente');
    const nombreProyecto = document.getElementById('proyecto-nombre').value.trim();
    const precio = parseFloat(document.getElementById('proyecto-precio').value) || 0;
    const cuota = parseFloat(document.getElementById('proyecto-cuota').value) || null;

    // Obtener estatus personalizado si se seleccionó
    const estatusSelect = document.getElementById('proyecto-estatus');
    let estatus = estatusSelect.value;
    if (estatus === 'custom') {
        estatus = document.getElementById('proyecto-estatus-custom').value.trim() || null;
    }

    const clienteId = clienteSelect.value;

    if (!clienteId) {
        alert('Debes seleccionar un cliente');
        return;
    }

    if (!nombreProyecto) {
        alert('El nombre del proyecto es obligatorio');
        return;
    }

    // Generar código
    const cliente = clienteSelect.options[clienteSelect.selectedIndex]?.text;
    const { data: proyectosCount } = await supabase.from('proyectos').select('id');
    const contador = (proyectosCount?.length || 0) + 1;
    const codigo = generarCodigoSesion(cliente, nombreProyecto, contador);

    const proyecto = {
        cliente_id: clienteId,
        nombre_proyecto: nombreProyecto,
        codigo: codigo,
        precio_total: precio,
        valor_cuota: cuota,
        estatus: estatus || null
    };

    const { data: result, error } = await supabase.from('proyectos').insert(proyecto);

    if (error) {
        alert('Error al crear proyecto: ' + error.message);
        return;
    }

    document.getElementById('proyecto-success').textContent = `✅ Proyecto '${nombreProyecto}' creado con código ${codigo}`;
    document.getElementById('form-proyecto').reset();
    await loadProyectosTabla();

    setTimeout(() => {
        document.getElementById('proyecto-success').textContent = '';
    }, 3000);
}

// ===== FORMS SETUP =====
function setupForms() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('form-cliente').addEventListener('submit', handleClienteSubmit);
    document.getElementById('form-ingreso').addEventListener('submit', handleIngresoSubmit);
    document.getElementById('form-gasto').addEventListener('submit', handleGastoSubmit);
    document.getElementById('form-proyecto').addEventListener('submit', handleProyectoSubmit);
    document.getElementById('form-deuda').addEventListener('submit', handleDeudaSubmit);
    document.getElementById('form-sesion').addEventListener('submit', handleSesionSubmit);

    // IA sugerencia para gastos
    document.getElementById('gasto-descripcion').addEventListener('input', (e) => {
        if (e.target.value.length > 3) {
            sugerirCategoriaGasto(e.target.value);
        }
    });

    // Estatus personalizado para proyectos
    const estatusSelect = document.getElementById('proyecto-estatus');
    const estatusCustomGroup = document.getElementById('proyecto-estatus-custom-group');
    if (estatusSelect && estatusCustomGroup) {
        estatusSelect.addEventListener('change', () => {
            if (estatusSelect.value === 'custom') {
                estatusCustomGroup.style.display = 'block';
            } else {
                estatusCustomGroup.style.display = 'none';
            }
        });
    }
}

// ===== TABS SETUP =====
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// ===== MOBILE MENU TOGGLE =====
function setupMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (!menuToggle || !sidebar) return;

    // Abrir menú
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    });

    // Cerrar menú con overlay
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // Cerrar menú al navegar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    });

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    });
}

// ===== INIT =====
async function init() {
    setupNavigation();
    setupForms();
    setupTabs();
    setupModalCliente();
    setupMobileMenu();
    setupBuscadores();
    await checkAuth();
}

// ===== GLOBAL FUNCTIONS (for onclick handlers) =====
window.deleteCliente = deleteCliente;
window.eliminarIngreso = eliminarIngreso;
window.eliminarGasto = eliminarGasto;
window.eliminarProyecto = eliminarProyecto;
window.eliminarDeuda = eliminarDeuda;
window.eliminarSesion = eliminarSesion;
window.cambiarEstatusProyecto = cambiarEstatusProyecto;
window.registrarPagoDeuda = registrarPagoDeuda;
window.generarFacturaProyecto = generarFacturaProyecto;
window.cambiarOrdenIngresos = cambiarOrdenIngresos;
window.cambiarOrdenGastos = cambiarOrdenGastos;
window.cambiarOrdenSesiones = cambiarOrdenSesiones;
window.cambiarMes = cambiarMes;
window.toggleConceptoCustom = () => {
    const select = document.getElementById('factura-concepto');
    const customGroup = document.getElementById('concepto-custom-group');
    if (select && customGroup) {
        customGroup.style.display = select.value === 'custom' ? 'block' : 'none';
    }
};

// Start app
init();
async function generarFacturaProyecto(proyectoId) {
    // Obtener datos del proyecto con fetch directo (nuestro cliente no soporta joins)
    const session = JSON.parse(localStorage.getItem('supabase_session') || 'null');
    const token = session?.access_token || SUPABASE_ANON_KEY;

    try {
        // Fetch proyectos
        const proyectosRes = await fetch(`${SUPABASE_URL}/rest/v1/proyectos?id=eq.${proyectoId}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const proyectos = await proyectosRes.json();
        const proyecto = proyectos[0];

        if (!proyecto) {
            alert('Proyecto no encontrado');
            return;
        }

        // Fetch cliente
        let cliente = null;
        if (proyecto.cliente_id) {
            const clienteRes = await fetch(`${SUPABASE_URL}/rest/v1/clientes?id=eq.${proyecto.cliente_id}`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const clientesData = await clienteRes.json();
            cliente = clientesData[0];
        }

        // Fetch ingresos del proyecto
        const ingresosRes = await fetch(`${SUPABASE_URL}/rest/v1/ingresos?proyecto_id=eq.${proyectoId}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const ingresos = await ingresosRes.json();

        // Calcular pagado y pendiente
        const pagado = (ingresos || []).reduce((sum, i) => sum + (parseFloat(i.monto) || 0), 0);
        const pendiente = (proyecto.precio_total || 0) - pagado;

        // Agregar cliente al proyecto
        proyecto.clientes = cliente;

        // Mostrar modal de opciones
        mostrarModalFactura(proyecto, pagado, pendiente, ingresos || []);
    } catch (error) {
        console.error('Error generando factura:', error);
        alert('Error al cargar datos del proyecto: ' + error.message);
    }
}

function mostrarModalFactura(proyecto, pagado, pendiente, pagos) {
    const modal = document.createElement('div');
    modal.id = 'modal-factura';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    const cliente = proyecto.clientes || {};
    const numeroOrden = `DM-${String(Date.now()).slice(-6)}`;

    modal.innerHTML = `
        <div style="background: var(--color-cream); border-radius: 8px; padding: 2rem; max-width: 550px; width: 90%; max-height: 85vh; overflow-y: auto;">
            <h3 style="color: var(--color-primary); margin-bottom: 1.5rem; font-family: 'Cormorant Garamond', serif;">📄 Generar Documento</h3>

            <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-taupe);">
                <p style="font-size: 0.9rem; margin-bottom: 0.5rem;"><strong>Proyecto:</strong> ${proyecto.nombre_proyecto}</p>
                <p style="font-size: 0.9rem; margin-bottom: 0.5rem;"><strong>Cliente registrado:</strong> ${cliente.nombre || 'N/A'}</p>
                <p style="font-size: 0.9rem; margin-bottom: 0.5rem;"><strong>Total:</strong> ${formatCurrency(proyecto.precio_total)}</p>
                <p style="font-size: 0.9rem; margin-bottom: 0.5rem;"><strong>Pagado:</strong> ${formatCurrency(pagado)}</p>
                <p style="font-size: 0.9rem;"><strong>Pendiente:</strong> ${formatCurrency(pendiente)}</p>
            </div>

            <form id="form-generar-factura" style="display: flex; flex-direction: column; gap: 0.75rem;">
                <h4 style="color: var(--color-primary); font-size: 0.9rem; margin-bottom: 0.25rem;">Información del Cliente</h4>

                <div>
                    <label style="display: block; font-size: 0.85rem; margin-bottom: 0.25rem;">Nombre completo o Razón Social *</label>
                    <input type="text" id="factura-cliente-nombre" required placeholder="Ej: Juan Pérez o Empresa SAS" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(94,28,46,0.3); border-radius: 4px;" value="${cliente.nombre || ''}">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.25rem;">Teléfono *</label>
                        <input type="tel" id="factura-cliente-telefono" required placeholder="+57 300 1234567" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(94,28,46,0.3); border-radius: 4px;" value="${cliente.contacto_telefono || ''}">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.25rem;">Email</label>
                        <input type="email" id="factura-cliente-email" placeholder="cliente@email.com" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(94,28,46,0.3); border-radius: 4px;" value="${cliente.contacto_email || ''}">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.25rem;">Tipo de documento *</label>
                        <select id="factura-cliente-tipo-doc" required style="width: 100%; padding: 0.5rem; border: 1px solid rgba(94,28,46,0.3); border-radius: 4px;">
                            <option value="">Seleccionar...</option>
                            <option value="CC">CC (Cédula de Ciudadanía)</option>
                            <option value="TI">TI (Tarjeta de Identidad)</option>
                            <option value="CE">CE (Cédula de Extranjería)</option>
                            <option value="NIT">NIT (Número de Identificación Tributaria)</option>
                            <option value="PAS">Pasaporte</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.25rem;">Número de documento *</label>
                        <input type="text" id="factura-cliente-numero-doc" required placeholder="Ej: 1052416657" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(94,28,46,0.3); border-radius: 4px;">
                    </div>
                </div>

                <h4 style="color: var(--color-primary); font-size: 0.9rem; margin: 0.5rem 0 0.25rem 0;">Configuración del Documento</h4>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.25rem;">Tipo de documento:</label>
                        <select id="factura-tipo" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(94,28,46,0.3); border-radius: 4px;">
                            <option value="orden">Orden de Compra</option>
                            <option value="factura">Factura</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.25rem;">Moneda:</label>
                        <select id="factura-moneda" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(94,28,46,0.3); border-radius: 4px;">
                            <option value="COP">COP (Pesos Colombianos)</option>
                            <option value="USD">USD (Dólares)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label style="display: block; font-size: 0.85rem; margin-bottom: 0.25rem;">Concepto:</label>
                    <select id="factura-concepto" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(94,28,46,0.3); border-radius: 4px;" onchange="toggleConceptoCustom()">
                        <option value="servicios">Servicios de Producción Musical</option>
                        <option value="grabacion">Servicios de Grabación</option>
                        <option value="mezcla">Servicios de Mezcla</option>
                        <option value="masterizacion">Servicios de Masterización</option>
                        <option value="completo">Producción Completa</option>
                        <option value="custom">Personalizado</option>
                    </select>
                </div>

                <div id="concepto-custom-group" style="display: none;">
                    <label style="display: block; font-size: 0.85rem; margin-bottom: 0.25rem;">Descripción del concepto:</label>
                    <input type="text" id="factura-concepto-custom" placeholder="Ej: Producción, mezcla y masterización de..." style="width: 100%; padding: 0.5rem; border: 1px solid rgba(94,28,46,0.3); border-radius: 4px;">
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
                    <input type="checkbox" id="factura-incluir-iva" style="width: auto;">
                    <label for="factura-incluir-iva" style="font-size: 0.85rem;">Incluir IVA (19%)</label>
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="factura-mostrar-pagado" checked style="width: auto;">
                    <label for="factura-mostrar-pagado" style="font-size: 0.85rem;">Mostrar pagos realizados</label>
                </div>

                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    <button type="button" id="btn-cancelar-factura" style="flex: 1; padding: 0.75rem; border: 1px solid var(--color-taupe); border-radius: 4px; background: transparent; cursor: pointer; font-size: 0.85rem;">Cancelar</button>
                    <button type="submit" class="btn-primary" style="flex: 1; padding: 0.75rem; border: none; border-radius: 4px; background: var(--color-primary); color: white; cursor: pointer; font-size: 0.85rem;">Generar PDF</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Toggle concepto custom
    window.toggleConceptoCustom = function() {
        const select = document.getElementById('factura-concepto');
        const customGroup = document.getElementById('concepto-custom-group');
        customGroup.style.display = select.value === 'custom' ? 'block' : 'none';
    };

    // Botón cancelar
    document.getElementById('btn-cancelar-factura').addEventListener('click', () => {
        cerrarModalFactura();
    });

    // Submit handler
    document.getElementById('form-generar-factura').addEventListener('submit', (e) => {
        e.preventDefault();

        const tipo = document.getElementById('factura-tipo').value;
        const moneda = document.getElementById('factura-moneda').value;
        const incluirIva = document.getElementById('factura-incluir-iva').checked;
        const mostrarPagado = document.getElementById('factura-mostrar-pagado').checked;
        const concepto = document.getElementById('factura-concepto').value;
        const conceptoCustom = document.getElementById('factura-concepto-custom').value;

        // Datos del cliente
        const nombreCliente = document.getElementById('factura-cliente-nombre').value;
        const telefonoCliente = document.getElementById('factura-cliente-telefono').value;
        const emailCliente = document.getElementById('factura-cliente-email').value;
        const tipoDoc = document.getElementById('factura-cliente-tipo-doc').value;
        const numeroDoc = document.getElementById('factura-cliente-numero-doc').value;

        // Preparar datos para el PDF
        const conceptoFinal = concepto === 'custom' ? (conceptoCustom || 'Servicios profesionales') : getConceptoLabel(concepto);

        const items = [];

        if (mostrarPagado && pagado > 0) {
            items.push({
                descripcion: `${conceptoFinal} - Pago inicial`,
                cantidad: 1,
                valorUnitario: pagado
            });
        }

        if (pendiente > 0) {
            items.push({
                descripcion: `${conceptoFinal} - Saldo pendiente`,
                cantidad: 1,
                valorUnitario: pendiente
            });
        }

        // Si no hay pagos, poner el total como un solo item
        if (items.length === 0) {
            items.push({
                descripcion: conceptoFinal,
                cantidad: 1,
                valorUnitario: proyecto.precio_total || 0
            });
        }

        const datosPDF = {
            numero: numeroOrden,
            fecha: new Date().toLocaleDateString('es-CO'),
            cliente: {
                nombre: nombreCliente || 'Cliente',
                email: emailCliente || '',
                telefono: telefonoCliente || '',
                documento: `${tipoDoc}: ${numeroDoc}`,
                proyecto: proyecto.nombre_proyecto
            },
            items: items
        };

        // Generar PDF
        generarPDF(datosPDF, {
            tipo,
            moneda,
            incluirIva,
            outputName: `${tipo}_${numeroOrden}.pdf`
        });

        cerrarModalFactura();
    });
}

function getConceptoLabel(concepto) {
    const labels = {
        'servicios': 'Servicios de Producción Musical',
        'grabacion': 'Servicios de Grabación',
        'mezcla': 'Servicios de Mezcla',
        'masterizacion': 'Servicios de Masterización',
        'completo': 'Producción Musical Completa'
    };
    return labels[concepto] || 'Servicios profesionales';
}

function cerrarModalFactura() {
    const modal = document.getElementById('modal-factura');
    if (modal) {
        modal.remove();
    }
}
