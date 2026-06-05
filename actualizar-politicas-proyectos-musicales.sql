-- ============================================
-- ACTUALIZAR POLÍTICAS RLS - PROYECTOS MUSICALES
-- ============================================
-- Esto permite que usuarios autenticados vean TODOS los proyectos
-- (activos y ocultos) desde el panel administrativo
-- ============================================

-- Eliminar política anterior de SELECT
DROP POLICY IF EXISTS "Cualquiera puede ver proyectos musicales" ON proyectos_musicales;

-- Nueva política: público solo ve activos, autenticados ven todos
CREATE POLICY "Público solo ve proyectos activos"
ON proyectos_musicales
FOR SELECT
TO anon
USING (activo = true);

CREATE POLICY "Autenticados ven todos los proyectos"
ON proyectos_musicales
FOR SELECT
TO authenticated
USING (true);

-- Verificación
-- SELECT * FROM proyectos_musicales ORDER BY orden ASC;
