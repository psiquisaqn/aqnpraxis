import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Permite importar desde @supabase/ssr sin warnings de bundling
  serverExternalPackages: ['@supabase/ssr'],

  images: {
    remotePatterns: [
      {
        // Supabase Storage para avatares e imágenes de ítems
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}

export default nextConfig
