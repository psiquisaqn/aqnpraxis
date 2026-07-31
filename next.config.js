/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // <-- OBLIGATORIO para Capacitor
  images: {
    unoptimized: true, // necesario para exportación estática
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  trailingSlash: true, // mejora el enrutamiento en la app móvil
}

module.exports = nextConfig