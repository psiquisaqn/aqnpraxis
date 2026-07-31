const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appPath = path.join(process.cwd(), 'app');
const backupPath = path.join(process.cwd(), 'app_backup');

// Carpetas a mover (rutas dinámicas que no se pueden exportar estáticamente)
const foldersToMove = [
  'api',
  'coopersmith',
  'bdi2',
  'peca',
  'wisc5',
  'dual-control',
  'sala',
  'display',
  'session',
  'dual-display',
  'auth', // si tiene callbacks
  'resultados', // puede tener rutas dinámicas
  // agrega más según sea necesario
];

function moveFolder(source, dest) {
  if (fs.existsSync(source)) {
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.renameSync(source, dest);
    console.log(`✅ Movido ${source} → ${dest}`);
  }
}

// Crear backup de toda la carpeta app
if (fs.existsSync(backupPath)) {
  fs.rmSync(backupPath, { recursive: true, force: true });
}
fs.mkdirSync(backupPath, { recursive: true });

// Mover carpetas problemáticas
for (const folder of foldersToMove) {
  const src = path.join(appPath, folder);
  const dest = path.join(backupPath, folder);
  if (fs.existsSync(src)) {
    moveFolder(src, dest);
  }
}

// Ejecutar next build
try {
  console.log('🏗️  Ejecutando next build...');
  execSync('npx next build', { stdio: 'inherit' });
} catch (error) {
  // Restaurar carpetas en caso de error
  console.log('⚠️  Error en build, restaurando carpetas...');
  for (const folder of foldersToMove) {
    const src = path.join(backupPath, folder);
    const dest = path.join(appPath, folder);
    if (fs.existsSync(src)) {
      moveFolder(src, dest);
    }
  }
  fs.rmSync(backupPath, { recursive: true, force: true });
  throw error;
}

// Restaurar carpetas después del build
console.log('✅ Build completado, restaurando carpetas...');
for (const folder of foldersToMove) {
  const src = path.join(backupPath, folder);
  const dest = path.join(appPath, folder);
  if (fs.existsSync(src)) {
    moveFolder(src, dest);
  }
}
fs.rmSync(backupPath, { recursive: true, force: true });
console.log('✅ Carpeta restaurada.');