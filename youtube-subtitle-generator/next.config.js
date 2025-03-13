/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 在生产构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
  // 忽略 TypeScript 类型检查错误
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
