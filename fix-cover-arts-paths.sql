-- ============================================
-- FIX: Actualizar paths de cover_art
-- ============================================
-- Quitar el './' inicial de los cover_art paths
-- ============================================

UPDATE proyectos_musicales
SET cover_art = 'cover-arts/Tus Brazos.JPG'
WHERE titulo = 'Tus Brazos';

UPDATE proyectos_musicales
SET cover_art = 'cover-arts/Solo Otra Vez.png'
WHERE titulo = 'Solo Otra Vez';

UPDATE proyectos_musicales
SET cover_art = 'cover-arts/PRIMITIVO (Primavera).png'
WHERE titulo = 'PRIMITIVO (Primavera)';

UPDATE proyectos_musicales
SET cover_art = 'cover-arts/Dios y Yo.png'
WHERE titulo = 'Dios y Yo';

UPDATE proyectos_musicales
SET cover_art = 'cover-arts/La Ciudad de los Vientos.jpg'
WHERE titulo = 'La Ciudad de Los Vientos';

UPDATE proyectos_musicales
SET cover_art = 'cover-arts/Mateo.png'
WHERE titulo = 'Mateo';

UPDATE proyectos_musicales
SET cover_art = 'cover-arts/Portada la silbaora.jpg'
WHERE titulo = 'La Silbaora';

UPDATE proyectos_musicales
SET cover_art = 'cover-arts/MARMOL (Invierno).png'
WHERE titulo = 'MARMOL (Invierno)';

UPDATE proyectos_musicales
SET cover_art = 'cover-arts/Siempre a Ti.png'
WHERE titulo = 'Siempre a Ti';

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- SELECT titulo, cover_art FROM proyectos_musicales;
