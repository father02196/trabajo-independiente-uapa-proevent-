const fs = require('fs');
let code = fs.readFileSync('rutas_fase4.js', 'utf8');

// 1. Add verificarToken
if (!code.includes("const { verificarToken } = require('./utils/jwtUtils');")) {
  code = code.replace(
    "module.exports = (db) => {",
    "const { verificarToken } = require('./utils/jwtUtils');\n\nmodule.exports = (db) => {"
  );
}

// 2. Admin routes
code = code.replace(
  "router.post('/admin/proveedor', async (req, res) => {",
  "router.post('/admin/proveedor', verificarToken, async (req, res) => {"
);
code = code.replace(
  "router.get('/admin/proveedores', (req, res) => {",
  "router.get('/admin/proveedores', verificarToken, (req, res) => {"
);
code = code.replace(
  "router.put('/admin/proveedor/:id', (req, res) => {",
  "router.put('/admin/proveedor/:id', verificarToken, (req, res) => {"
);
code = code.replace(
  "router.put('/admin/proveedor/:id/estado', (req, res) => {",
  "router.put('/admin/proveedor/:id/estado', verificarToken, (req, res) => {"
);
code = code.replace(
  "router.post('/admin/solicitud-cotizacion', (req, res) => {",
  "router.post('/admin/solicitud-cotizacion', verificarToken, (req, res) => {"
);
code = code.replace(
  "router.get('/admin/licitaciones-adjudicadas', (req, res) => {",
  "router.get('/admin/licitaciones-adjudicadas', verificarToken, (req, res) => {"
);
code = code.replace(
  "router.post('/admin/evaluar-cotizaciones/:id_solicitud', async (req, res) => {",
  "router.post('/admin/evaluar-cotizaciones/:id_solicitud', verificarToken, async (req, res) => {"
);

// 3. Provider routes
code = code.replace(
  "router.get('/proveedor/:id_tipo/solicitudes', (req, res) => {",
  `router.get('/proveedor/:id_tipo/solicitudes', verificarToken, (req, res) => {
    if (req.user.tipo_usuario !== 'proveedor' || req.user.id_tipo.toString() !== req.params.id_tipo.toString()) {
      return res.status(403).json({ error: 'Acceso denegado a estas solicitudes' });
    }`
);
code = code.replace(
  "router.get('/proveedor/:id_proveedor/metricas', (req, res) => {",
  `router.get('/proveedor/:id_proveedor/metricas', verificarToken, (req, res) => {
    if (req.user.tipo_usuario !== 'proveedor' || req.user.id_proveedor.toString() !== req.params.id_proveedor.toString()) {
      return res.status(403).json({ error: 'Acceso denegado a estas métricas' });
    }`
);

const uploadTarget = `  router.post('/proveedor/subir-cotizacion', upload.single('archivo_pdf'), async (req, res) => {
    try {`;
const uploadReplacement = `  router.post('/proveedor/subir-cotizacion', verificarToken, upload.single('archivo_pdf'), async (req, res) => {
    try {
      if (req.user.tipo_usuario !== 'proveedor') {
        return res.status(403).json({ error: 'Solo los proveedores pueden subir cotizaciones' });
      }`;
code = code.replace(uploadTarget, uploadReplacement);

// 4. Login JWT
const loginTarget = `      if (proveedor.estado !== 'Activo') return res.status(403).json({ error: 'Cuenta inactiva o suspendida.' });

      res.json({ message: 'Login exitoso', proveedor: { id: proveedor.id_proveedor, nombre: proveedor.nombre_empresa, id_tipo: proveedor.id_tipo_servicio } });
    });
  });`;
const loginReplacement = `      if (proveedor.estado !== 'Activo') return res.status(403).json({ error: 'Cuenta inactiva o suspendida.' });

      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('./utils/jwtUtils');
      const tokenPayload = {
        id_proveedor: proveedor.id_proveedor,
        id_tipo: proveedor.id_tipo_servicio,
        nombre: proveedor.nombre_empresa,
        tipo_usuario: 'proveedor'
      };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });
      
      res.cookie('accessToken', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 15 * 60 * 1000 });

      res.json({ message: 'Login exitoso', proveedor: { id: proveedor.id_proveedor, nombre: proveedor.nombre_empresa, id_tipo: proveedor.id_tipo_servicio } });
    });
  });`;
code = code.replace(loginTarget, loginReplacement);

fs.writeFileSync('rutas_fase4.js', code, 'utf8');
console.log('Done');
