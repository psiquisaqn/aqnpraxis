/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // <-- solo para la exportación estática
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
  trailingSlash: true,
}

module.exports = nextConfig