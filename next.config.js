const CopyPlugin = require("copy-webpack-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // config.resolve.fallback = { fs: false };

    config.plugins.push(
      new CopyPlugin({
        patterns: [
          { from: "node_modules/@sglkc/kuromoji/dict", to: "static/kuromoji" },
        ],
      }),
    );

    return config;
  },
};

module.exports = nextConfig;
