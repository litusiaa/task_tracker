/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['api.pipedrive.com'],
  },
  env: {
    APP_TIMEZONE: 'Europe/Moscow',
  },
}

export default nextConfig

