/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.externals.push({
            'undici': 'commonjs undici',
        });
        return config;
    },
};

module.exports = nextConfig;
