# Agente Gwen Web - Migración y Despliegue

Sistema financiero web para Dieco Mancipe, migrado de Streamlit a aplicación web moderna.

---

## 📋 Pasos para Completar la Migración

### Paso 1: Ejecutar Schema en Supabase

1. Abrí https://supabase.com y entrá a tu proyecto `Agente-Gwen`
2. Andá a **SQL Editor** (menú izquierdo)
3. Click en **"New Query"**
4. Abrí el archivo `supabase-schema.sql` en este directorio
5. Copiá TODO el contenido y pegalo en el editor
6. Click en **"Run"**

✅ Esto crea las 7 tablas necesarias con sus índices y políticas de seguridad.

---

### Paso 2: Migrar Tus Datos

1. En el mismo SQL Editor
2. Abrí el archivo `datos_migracion.sql`
3. Copiá TODO el contenido y pegalo en el editor
4. Click en **"Run"**

✅ Esto migra:
- 13 clientes
- 23 proyectos
- 27 ingresos
- 4 deudas
- 2 sesiones
- 1 clasificación IA

---

### Paso 3: Crear Usuario para Login

Para poder ingresar a la app, necesitás crear un usuario:

1. En Supabase, andá a **Authentication** → **Users**
2. Click en **"Add user"** → **"Create new user"**
3. Completá:
   - **Email:** tu email (ej: `diegomancipe33@gmail.com`)
   - **Password:** una contraseña segura
   - **Auto Confirm User:** ✅ activado
4. Click en **"Create user"**

---

### Paso 4: Probar la App Localmente

1. Abrí `index.html` directamente en tu browser
2. Ingresá con el email y contraseña que creaste
3. Deberías ver el dashboard con tus datos

**Nota:** La app usa Supabase directamente, así que necesitás conexión a internet.

---

### Paso 5: Desplegar en Vercel (Próximo paso)

1. Subí este directorio a GitHub
2. Conectá el repo en Vercel
3. Listo!

---

## 📁 Archivos del Proyecto

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Página principal con toda la estructura |
| `styles.css` | Estilos con identidad visual burgundy/cream |
| `app.js` | Lógica de la app y conexión a Supabase |
| `supabase-schema.sql` | Schema de base de datos (Paso 1) |
| `datos_migracion.sql` | Datos migrados (Paso 2) |
| `migrar_datos.py` | Script que generó la migración |
| `datos_exportados.json` | Backup JSON de tus datos |

---

## 🎨 Identidad Visual

La app mantiene los colores de marca:
- **Burgundy:** `#5e1c2e` (primario)
- **Cream:** `#f4f3e9` (fondo)
- **Taupe:** `#c5b8aa` (acento)
- **Yellow:** `#f9f7dc` (secciones)

Fuentes:
- Títulos: Cormorant Garamond (italic)
- Cuerpo: Space Mono

---

## 🔐 Seguridad

- Autenticación con Supabase Auth
- Row Level Security (RLS) habilitado
- Solo usuarios autenticados pueden ver los datos
- Sesión guardada localmente

---

## 📊 Funcionalidades

Todas las secciones de la app original:
1. **Dashboard** - Vista general con métricas
2. **Registrar Ingreso** - Con opción nuevo cliente
3. **Registrar Gasto** - Con sugerencia automática de categoría
4. **Gestionar Registros** - Ver/eliminar ingresos y gastos
5. **Proyectos** - Tabla de estados, crear nuevo
6. **Deudas** - Con pagos parciales
7. **Sesiones** - Bitácora con códigos automáticos
8. **Reportes** - Balance por proyecto, flujo de caja

---

## 🚧 Pendientes

- [ ] Implementar creación completa de proyectos (falta lógica)
- [ ] Mejorar validación de formularios
- [ ] Agregar exportación a PDF/Excel
- [ ] Integración con WhatsApp
- [ ] Dominio personalizado en Vercel

---

## 📞 Soporte

Si algo falla:
1. Verificá que el schema se ejecutó sin errores
2. Verificá que los datos se migraron (fijate en **Table Editor** en Supabase)
3. Fijate la consola del browser (F12) para errores de JavaScript
