/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 优化构建性能
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  // 避免构建时连接外部服务
  env: {
    SKIP_BUILD_STATIC_GENERATION: 'true',
  },
}

export default nextConfig
