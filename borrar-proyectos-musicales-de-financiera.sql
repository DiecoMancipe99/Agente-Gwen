-- ============================================
-- BORRAR PROYECTOS MUSICALES DE TABLA FINANCIERA
-- ============================================
-- Esto borra los proyectos que están en la tabla 'proyectos'
-- pero que en realidad son trabajos musicales para el catálogo
-- ============================================

-- Opción 1: Borrar TODOS los proyectos musicales por estado_vital = 'RELEASE'
DELETE FROM proyectos WHERE estado_vital = 'RELEASE';

-- Opción 2: Borrar proyectos específicos por nombre
-- (Descomentar si querés borrar solo algunos)
/*
DELETE FROM proyectos WHERE nombre_proyecto IN (
    'Tus Brazos',
    'Solo Otra Vez',
    'PRIMITIVO (Primavera)',
    'Dios y Yo',
    'La Ciudad de Los Vientos',
    'Mateo',
    'La Silbaora',
    'MARMOL (Invierno)',
    'Siempre a Ti'
);
*/

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- SELECT * FROM proyectos;
-- Deberían quedar solo los proyectos financieros reales (trabajos con clientes)
