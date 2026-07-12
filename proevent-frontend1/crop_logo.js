const sharp = require('sharp');
const path = require('path');

const input = path.join(__dirname, 'src/img/Emblema-Proevent.jpeg');
const output = path.join(__dirname, 'src/img/logo-icono.png');

sharp(input)
  .metadata()
  .then(meta => {
    console.log('Dimensiones originales:', meta.width, 'x', meta.height);

    // La imagen es 1254x1254
    // El ícono UP está centrado, empieza ~pixel 130 desde arriba
    // El calendario termina ~pixel 750 desde arriba
    // El texto "UAPA-ProEvent" empieza ~pixel 780
    const top = 110;
    const cropHeight = 660;  // Captura el ícono completo hasta justo antes del texto
    const marginSide = Math.floor(meta.width * 0.08);

    console.log(`Recortando: left=${marginSide}, top=${top}, width=${meta.width - marginSide*2}, height=${cropHeight}`);

    return sharp(input)
      .extract({
        left: marginSide,
        top: top,
        width: meta.width - (marginSide * 2),
        height: cropHeight
      })
      .png({ quality: 100 })
      .toFile(output);
  })
  .then(info => {
    console.log('✅ Ícono guardado:', info.width, 'x', info.height, 'px →', output);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
