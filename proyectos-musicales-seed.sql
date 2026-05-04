-- ============================================
-- AGENTE GWEN - SEMILLA DE PROYECTOS MUSICALES
-- ============================================
-- Ejecutar este script en Supabase SQL Editor para poblar
-- la tabla 'proyectos' con los 9 proyectos musicales de Dieco
-- ============================================

-- Primero, asegurarnos de que existen los clientes
-- (si no existen, los creamos)

INSERT INTO clientes (nombre, contacto_email, contacto_telefono)
SELECT 'julileuro', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre = 'julileuro');

INSERT INTO clientes (nombre, contacto_email, contacto_telefono)
SELECT 'Amarenna', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre = 'Amarenna');

INSERT INTO clientes (nombre, contacto_email, contacto_telefono)
SELECT 'Ktik', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre = 'Ktik');

INSERT INTO clientes (nombre, contacto_email, contacto_telefono)
SELECT 'ANDER KEY', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre = 'ANDER KEY');

INSERT INTO clientes (nombre, contacto_email, contacto_telefono)
SELECT 'Marigombri', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre = 'Marigombri');

-- ============================================
-- PROYECTOS MUSICALES (9 proyectos)
-- ============================================

-- 2026 - Tus Brazos - julileuro
INSERT INTO proyectos (
    cliente_id,
    nombre_proyecto,
    codigo,
    precio_total,
    genero,
    anio,
    servicios,
    notas,
    spotify_track_id,
    estado_vital,
    creado_en
)
SELECT
    c.id,
    'Tus Brazos',
    'DM-TUSB-001-PT',
    0,
    'Cantautor / Pop',
    2026,
    'Producción, Grabación, Mezcla, Masterización',
    'Presente en todas las etapas de la canción',
    '1UzH8nd74uk3SsYMigISuj',
    'RELEASE',
    NOW()
FROM clientes c WHERE c.nombre = 'julileuro'
ON CONFLICT DO NOTHING;

-- 2026 - Solo Otra Vez - Amarenna
INSERT INTO proyectos (
    cliente_id,
    nombre_proyecto,
    codigo,
    precio_total,
    genero,
    anio,
    servicios,
    notas,
    spotify_track_id,
    estado_vital,
    creado_en
)
SELECT
    c.id,
    'Solo Otra Vez',
    'DM-SOOV-002-PT',
    0,
    'Tropipop / Pop',
    2026,
    'Producción, Grabación, Mezcla, Masterización',
    'Presente en todas las etapas de la canción',
    '0kyFOrOigzJe6e8YEuywkd',
    'RELEASE',
    NOW()
FROM clientes c WHERE c.nombre = 'Amarenna'
ON CONFLICT DO NOTHING;

-- 2026 - PRIMITIVO (Primavera) - Ktik
INSERT INTO proyectos (
    cliente_id,
    nombre_proyecto,
    codigo,
    precio_total,
    genero,
    anio,
    servicios,
    notas,
    spotify_track_id,
    estado_vital,
    creado_en
)
SELECT
    c.id,
    'PRIMITIVO (Primavera)',
    'DM-PRIP-003-PT',
    0,
    'Pop',
    2026,
    'Masterización',
    NULL,
    '79SV9FKNsHJZ59GQ1GbmIC',
    'RELEASE',
    NOW()
FROM clientes c WHERE c.nombre = 'Ktik'
ON CONFLICT DO NOTHING;

-- 2026 - Dios y Yo - ANDER KEY
INSERT INTO proyectos (
    cliente_id,
    nombre_proyecto,
    codigo,
    precio_total,
    genero,
    anio,
    servicios,
    notas,
    spotify_track_id,
    estado_vital,
    creado_en
)
SELECT
    c.id,
    'Dios y Yo',
    'DM-DIOY-004-PT',
    0,
    'Balada',
    2026,
    'Ingeniero de Grabación',
    'Grabación de Background Vocals',
    '1Ei5c2GshPH8tC60h7YhUo',
    'RELEASE',
    NOW()
FROM clientes c WHERE c.nombre = 'ANDER KEY'
ON CONFLICT DO NOTHING;

-- 2026 - La Ciudad de Los Vientos - julileuro
INSERT INTO proyectos (
    cliente_id,
    nombre_proyecto,
    codigo,
    precio_total,
    genero,
    anio,
    servicios,
    notas,
    spotify_track_id,
    estado_vital,
    creado_en
)
SELECT
    c.id,
    'La Ciudad de Los Vientos',
    'DM-LCDV-005-PT',
    0,
    'Pop',
    2026,
    'Producción, Grabación, Mezcla, Masterización',
    'Presente en todas las etapas de la canción',
    '1cAwyRXZZLjfTpGPdXroIv',
    'RELEASE',
    NOW()
FROM clientes c WHERE c.nombre = 'julileuro'
ON CONFLICT DO NOTHING;

-- 2025 - Mateo - julileuro
INSERT INTO proyectos (
    cliente_id,
    nombre_proyecto,
    codigo,
    precio_total,
    genero,
    anio,
    servicios,
    notas,
    spotify_track_id,
    estado_vital,
    creado_en
)
SELECT
    c.id,
    'Mateo',
    'DM-MATE-006-PT',
    0,
    'Cantautor / Pop',
    2025,
    'Producción, Grabación, Mezcla, Masterización',
    'Presente en todas las etapas de la canción',
    '5sItxqQUQFpFO9rB5ZJ6kr',
    'RELEASE',
    NOW()
FROM clientes c WHERE c.nombre = 'julileuro'
ON CONFLICT DO NOTHING;

-- 2025 - La Silbaora - julileuro
INSERT INTO proyectos (
    cliente_id,
    nombre_proyecto,
    codigo,
    precio_total,
    genero,
    anio,
    servicios,
    notas,
    spotify_track_id,
    estado_vital,
    creado_en
)
SELECT
    c.id,
    'La Silbaora',
    'DM-LASI-007-PT',
    0,
    'Cantautor',
    2025,
    'Producción, Grabación, Mezcla, Masterización',
    'Presente en todas las etapas de la canción',
    '0LPUTxHF3Aq73pt7SWTgrQ',
    'RELEASE',
    NOW()
FROM clientes c WHERE c.nombre = 'julileuro'
ON CONFLICT DO NOTHING;

-- 2025 - MARMOL (Invierno) - Ktik
INSERT INTO proyectos (
    cliente_id,
    nombre_proyecto,
    codigo,
    precio_total,
    genero,
    anio,
    servicios,
    notas,
    spotify_track_id,
    estado_vital,
    creado_en
)
SELECT
    c.id,
    'MARMOL (Invierno)',
    'DM-MARI-008-PT',
    0,
    'Pop',
    2025,
    'Masterización',
    NULL,
    '4aHsB4QJKUL4yU1g81jWG3',
    'RELEASE',
    NOW()
FROM clientes c WHERE c.nombre = 'Ktik'
ON CONFLICT DO NOTHING;

-- 2024 - Siempre a Ti - Marigombri
INSERT INTO proyectos (
    cliente_id,
    nombre_proyecto,
    codigo,
    precio_total,
    genero,
    anio,
    servicios,
    notas,
    spotify_track_id,
    estado_vital,
    creado_en
)
SELECT
    c.id,
    'Siempre a Ti',
    'DM-SIAT-009-PT',
    0,
    'Bolero',
    2024,
    'Ingeniero de Grabación',
    'Grabación de trompeta',
    '2c5pe9NDktIsI9D1E8F16k',
    'RELEASE',
    NOW()
FROM clientes c WHERE c.nombre = 'Marigombri'
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecutar esto para ver los proyectos insertados:
-- SELECT * FROM proyectos WHERE estado_vital = 'RELEASE' ORDER BY anio DESC;
