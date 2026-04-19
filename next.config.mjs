/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdfkit ships its own font binaries; mark as external so Next doesn't try to bundle them
  webpack: (config) => {
    config.externals = [...(config.externals || []), { pdfkit: 'commonjs pdfkit' }];
    return config;
  },
};

export default nextConfig;
