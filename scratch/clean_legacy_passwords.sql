-- Script de limpieza segura para remover la columna `contrasena` (texto plano).
-- ESTE SCRIPT SÓLO DEBE EJECUTARSE CUANDO LA APLICACIÓN HAYA ESTADO EN PRODUCCIÓN
-- Y TODOS LOS USUARIOS ACTIVOS SE HAYAN MIGRADO A `password_hash`.

DELIMITER //

CREATE PROCEDURE LimpiarLegacyPasswordsSeguro()
BEGIN
    DECLARE rezagados INT;

    -- 1. Verificar cuántos usuarios (que no son eliminados) NO tienen password_hash
    SELECT COUNT(*) INTO rezagados 
    FROM usuario 
    WHERE password_hash IS NULL;

    -- 2. Si hay rezagados, abortar operación.
    IF rezagados > 0 THEN
        SELECT CONCAT('ABORTADO: Quedan ', rezagados, ' usuario(s) sin migrar. La limpieza fue cancelada.') AS Mensaje;
    ELSE
        -- 3. Si todos migraron, borrar columna heredada
        ALTER TABLE usuario DROP COLUMN contrasena;
        SELECT 'ÉXITO: La columna legacy de contraseñas ha sido eliminada permanentemente.' AS Mensaje;
    END IF;
END //

DELIMITER ;

-- Ejecutar limpieza
CALL LimpiarLegacyPasswordsSeguro();

-- Limpiar procedure
DROP PROCEDURE IF EXISTS LimpiarLegacyPasswordsSeguro;
