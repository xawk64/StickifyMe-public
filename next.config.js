const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Only bundled static images are used: the on-demand image optimizer
  // (/_next/image) is disabled, which also removes its attack surface.
  images: { unoptimized: true },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: { and: [/\.(ts)x?$/] },
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgoConfig: {
              plugins: [
                {
                  name: "preset-default",
                  params: {
                    overrides: {
                      // disable plugins
                      removeViewBox: false,
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    });
    return config;
  },
};

module.exports = nextConfig;
