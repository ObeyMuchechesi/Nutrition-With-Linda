const nextConfig = {
  experimental: {
    cpus: 1,
  },
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];

    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
