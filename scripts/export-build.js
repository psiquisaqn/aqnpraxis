const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiPath = path.join(process.cwd(), 'app', 'api');
const backupPath = path.join(process.cwd(), 'app_api_backup');

// Función para mover la carpeta api
function moveApi(source, dest) {
  if (fs.existsSync(source)) {
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.renameSync(source, dest);
    console.log(`✅ Movido ${source} → ${dest}`);
  } else {
    console.log(`⚠️ No existe la carpeta ${source}, omitiendo.`);
  }
}

console.log('📦 Iniciando build de exportación...');

// Mover solo la carpeta api antes de la build
moveApi(apiPath, backupPath);

// Ejecutar next build
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  // Restaurar api en caso de error
  moveApi(backupPath, apiPath);
  throw error;
}

// Restaurar api después de la build
moveApi(backupPath, apiPath);

console.log('✅ Build completado y api restaurada.');