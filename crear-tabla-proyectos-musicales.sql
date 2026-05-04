-- ============================================
-- CREAR TABLA PROYECTOS MUSICALES (CATÁLOGO)
-- ============================================
-- Esta tabla es SOLO para el catálogo público
-- Separada de la tabla 'proyectos' financiera
-- ============================================

CREATE TABLE IF NOT EXISTS proyectos_musicales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    artista TEXT NOT NULL,
    anio INTEGER,
    genero TEXT,
    servicios TEXT,
    cover_art TEXT,
    spotify_track_id TEXT,
    notas TEXT,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para ordenar por año
CREATE INDEX IF NOT EXISTS idx_proyectos_musicales_anio
ON proyectos_musicales(anio DESC);

-- Índice para filtrar por activo
CREATE INDEX IF NOT EXISTS idx_proyectos_musicales_activo
ON proyectos_musicales(activo);

-- ============================================
-- INSERTAR LOS 9 PROYECTOS MUSICALES
-- ============================================

INSERT INTO proyectos_musicales (
    titulo, artista, anio, genero, servicios,
    cover_art, spotify_track_id, notas, orden
) VALUES
    ('Tus Brazos', 'julileuro', 2026, 'Cantautor / Pop',
     'Producción, Grabación, Mezcla, Masterización',
     './cover-arts/Tus Brazos.JPG',
     '1UzH8nd74uk3SsYMigISuj',
     'Presente en todas las etapas de la canción',
     1),

    ('Solo Otra Vez', 'Amarenna', 2026, 'Tropipop / Pop',
     'Producción, Grabación, Mezcla, Masterización',
     './cover-arts/Solo Otra Vez.png',
     '0kyFOrOigzJe6e8YEuywkd',
     'Presente en todas las etapas de la canción',
     2),

    ('PRIMITIVO (Primavera)', 'Ktik', 2026, 'Pop',
     'Masterización',
     './cover-arts/PRIMITIVO (Primavera).png',
     '79SV9FKNsHJZ59GQ1GbmIC',
     NULL,
     3),

    ('Dios y Yo', 'ANDER KEY', 2026, 'Balada',
     'Ingeniero de Grabación',
     './cover-arts/Dios y Yo.png',
     '1Ei5c2GshPH8tC60h7YhUo',
     'Grabación de Background Vocals',
     4),

    ('La Ciudad de Los Vientos', 'julileuro', 2026, 'Pop',
     'Producción, Grabación, Mezcla, Masterización',
     './cover-arts/La Ciudad de los Vientos.jpg',
     '1cAwyRXZZLjfTpGPdXroIv',
     'Presente en todas las etapas de la canción',
     5),

    ('Mateo', 'julileuro', 2025, 'Cantautor / Pop',
     'Producción, Grabación, Mezcla, Masterización',
     './cover-arts/Mateo.png',
     '5sItxqQUQFpFO9rB5ZJ6kr',
     'Presente en todas las etapas de la canción',
     6),

    ('La Silbaora', 'julileuro', 2025, 'Cantautor',
     'Producción, Grabación, Mezcla, Masterización',
     './cover-arts/Portada la silbaora.jpg',
     '0LPUTxHF3Aq73pt7SWTgrQ',
     'Presente en todas las etapas de la canción',
     7),

    ('MARMOL (Invierno)', 'Ktik', 2025, 'Pop',
     'Masterización',
     './cover-arts/MARMOL (Invierno).png',
     '4aHsB4QJKUL4yU1g81jWG3',
     NULL,
     8),

    ('Siempre a Ti', 'Marigombri', 2024, 'Bolero',
     'Ingeniero de Grabación',
     './cover-arts/Siempre a Ti.png',
     '2c5pe9NDktIsI9D1E8F16k',
     'Grabación de trompeta',
     9);

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================
-- Permitir lectura pública (anon) para el catálogo
-- Solo escritura para usuarios autenticados

ALTER TABLE proyectos_musicales ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (cualquiera puede ver el catálogo)
CREATE POLICY "Cualquiera puede ver proyectos musicales"
ON proyectos_musicales
FOR SELECT
TO anon, authenticated
USING (activo = true);

-- Política de escritura (solo usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden insertar"
ON proyectos_musicales
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar"
ON proyectos_musicales
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar"
ON proyectos_musicales
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- SELECT * FROM proyectos_musicales ORDER BY anio DESC, orden ASC;
