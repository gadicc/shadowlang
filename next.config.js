// const CopyPlugin = require("copy-webpack-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/api/jpSentence": ["node_modules/@sglkc/kuromoji/dict/*"],
    },
  },
  webpack: (config) => {
    // config.resolve.fallback = { fs: false };

    /*
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: "node_modules/@sglkc/kuromoji/dict",
            to: "static/kuromoji",
          },
        ],
      }),
    );
    */

    return config;
  },
};

export default nextConfig;
