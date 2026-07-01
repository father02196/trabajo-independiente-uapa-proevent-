const jwt = require('jsonwebtoken');

// Obtener los secretos (en un entorno real estarían en .env)
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_proevent_123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'secreto_refresh_muy_largo_proevent_456';

// Generar Access Token (Tiempo de vida corto: 15 minutos)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id_usuario: user.id_usuario, rol: user.rol, correo: user.correo, nombre: user.nombre },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Generar Refresh Token (Tiempo de vida largo: 7 días)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id_usuario: user.id_usuario, rol: user.rol, correo: user.correo, nombre: user.nombre },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Middleware para verificar el token
const verificarToken = (req, res, next) => {
  // Leemos el token desde la cookie 'accessToken'
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ mensaje: 'No autorizado: Falta el token de acceso' });
  }

  try {
    const decodificado = jwt.verify(token, JWT_SECRET);
    req.user = decodificado; // Inyecta los datos del usuario en la request
    next(); // Permite pasar al siguiente middleware/controlador
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
