const createNextIntlPlugin = require('next-intl/plugin');

// Pointe vers votre fichier i18n.ts
const withNextIntl = createNextIntlPlugin('./src/i18n.ts'); 

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
};

module.exports = withNextIntl(nextConfig);