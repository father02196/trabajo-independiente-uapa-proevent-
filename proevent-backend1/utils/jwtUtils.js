const jwt = require('jsonwebtoken');

// Obtener los secretos (en un entorno real estarían en .env)
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_proevent_123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'secreto_refresh_muy_largo_proevent_456';

// Generar Access Token (Tiempo de vida corto: 15 minutos)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id_usuario: user.id_usuario, rol: user.rol, correo: user.correo, nombre: user.nombre, token_version: user.token_version || 0 },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Generar Refresh Token (Tiempo de vida largo: 7 días)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id_usuario: user.id_usuario, rol: user.rol, correo: user.correo, nombre: user.nombre, token_version: user.token_version || 0 },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Middleware para verificar el token
const verificarToken = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ mensaje: 'No autorizado: Falta el token de acceso' });
  }

  try {
    const decodificado = jwt.verify(token, JWT_SECRET);
    
    // Obtener la instancia global de la base de datos desde la app
    const db = req.app.locals.db;
    if (!db) {
      req.user = decodificado;
      return next(); // Fallback temporal en caso de que no haya DB inyectada
    }

    if (decodificado.tipo_usuario === 'proveedor') {
      db.query('SELECT estado FROM proveedor_externo WHERE id_proveedor = ?', [decodificado.id_proveedor], (err, results) => {
        if (err || results.length === 0 || results[0].estado !== 'Activo') {
          return res.status(401).json({ mensaje: 'No autorizado: Proveedor inactivo o no encontrado' });
        }
        req.user = decodificado;
        return next();
      });
      return;
    }

    // Validar token_version contra la base de datos para invalidación inmediata
    db.query('SELECT token_version FROM usuario WHERE id_usuario = ?', [decodificado.id_usuario], (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json({ mensaje: 'No autorizado: Usuario no encontrado o error' });
      }
      
      const currentDbVersion = results[0].token_version || 0;
      const tokenVersion = decodificado.token_version || 0;

      if (currentDbVersion !== tokenVersion) {
        return res.status(401).json({ mensaje: 'No autorizado: La sesión ha sido revocada por un cambio de credenciales.' });
      }

      req.user = decodificado; // Inyecta los datos del usuario validados en la request
      next(); // Permite pasar al siguiente middleware/controlador
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ mensaje: 'No autorizado: Token expirado', expired: true });
    }
    return res.status(401).json({ mensaje: 'No autorizado: Token inválido' });
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verificarToken,
  JWT_SECRET,
  JWT_REFRESH_SECRET
};
