/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk', '@google/generative-ai', 'groq-sdk'],
  },
}

export default nextConfig
