-- Agregar estado si no existe
ALTER TABLE tipo_servicio_externo ADD COLUMN IF NOT EXISTS estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo';

-- Insertar Audiovisuales si no existe
INSERT INTO tipo_servicio_externo (nombre, clasificacion, estado) 
SELECT * FROM (SELECT 'Audiovisuales', 'Corriente', 'Activo') AS tmp
WHERE NOT EXISTS (
    SELECT nombre FROM tipo_servicio_externo WHERE nombre = 'Audiovisuales'
) LIMIT 1;
