const fs = require('fs');
let code = fs.readFileSync('rutas_fase4.js', 'utf8');

const searchStr = "      if (proveedor.estado !== 'Activo') return res.status(403).json({ error: 'Cuenta inactiva o suspendida.' });";

const index = code.indexOf(searchStr);
if (index === -1) {
  console.log("Not found");
  process.exit(1);
}

const endStr = "    });\r\n  });";
const endStr2 = "    });\n  });";

let endIndex = code.indexOf(endStr, index);
let finalLen = endStr.length;
if (endIndex === -1) {
  endIndex = code.indexOf(endStr2, index);
  finalLen = endStr2.length;
}

if (endIndex === -1) {
  console.log("End not found");
  process.exit(1);
}

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

code = code.substring(0, index) + loginReplacement + code.substring(endIndex + finalLen);

fs.writeFileSync('rutas_fase4.js', code, 'utf8');
console.log('Login patched successfully');
