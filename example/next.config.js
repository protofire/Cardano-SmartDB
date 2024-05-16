/** @type {import('next').NextConfig} */

const path = require('path');

const nextConfig = {
    //-------------
    // PRODUCTION
    // swcMinify: true,
    // reactStrictMode: true,
    //-------------
    // DEV
    swcMinify: true,
    reactStrictMode: false,
    //-------------
    images: {
        domains: ['ipfs.io', 'taptools.io', 'taptools-public.s3.amazonaws.com', 'img.cexplorer.io'],
    },
    generateBuildId: async () => {
        // Generate your build ID here if needed
        // Return a unique value for each build, like a timestamp
        // return 'dummyId';
        return new Date().getTime().toString();
    },
    experimental: {
        // appDir: true,
        // serverActions: true, // <-- add this for mongoose and next13
        esmExternals: true, // <-- add this for mongoose and next13
        // serverComponentsExternalPackages:['mongoose'] // <-- add this for mongoose and next13 '@typegoose/typegoose'
    },
    webpack: (config, { isServer }) => {
        config.stats = 'verbose'; // or 'errors-only', 'minimal', etc.
        config.resolve.alias['react-native-sqlite-storage'] = false;
        config.experiments = {
            asyncWebAssembly: true,
            topLevelAwait: true,
            layers: true, // optional, with some bundlers/frameworks it doesn't work without
        };
        config.resolve.fullySpecified = false; // This allows you to omit extensions when importing ES modules
        //config.resolve.alias['aws-crt'] = path.resolve(__dirname, 'node_modules/aws-crt');
        config.resolve.alias['@example'] = path.resolve(__dirname, './');
        if (isServer) {
            config.externals.push('formidable');
        }
        // config.resolve.alias['lucid-cardano'] = path.resolve(__dirname, 'node_modules/lucid-cardano');
        // config.resolve.alias['easy-peasy'] = path.resolve(__dirname, 'node_modules/easy-peasy');
        // config.resolve.alias['react-notifications-component'] = path.resolve(__dirname, 'node_modules/react-notifications-component');
        // config.resolve.alias['mongosee'] = path.resolve(__dirname, 'node_modules/mongosee');
        return config;
    },
    async headers() {
        return [
            // {
            //     // Global headers applied to all routes
            //     source: '/:path*',
            //     headers: [
            //         // Clickjacking protection
            //         { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
            //         // XSS Protection for older browsers
            //         { key: 'X-XSS-Protection', value: '1; mode=block' },
            //         // Enforce the use of HTTPS
            //         { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
            //         // Referrer Policy for privacy and security
            //         { key: 'Referrer-Policy', value: 'no-referrer-when-downgrade' },
            //         // Content Security Policy to prevent XSS and data injection attacks
            //         // WARNING: This is an example. You need to tailor the CSP for your application's needs.
            //         {
            //             key: 'Content-Security-Policy',
            //             value: "default-src 'self'; script-src 'self' https://apis.google.com; img-src 'self' https://img.cexplorer.io; style-src 'self' 'unsafe-inline';",
            //         },
            //         // Permissions Policy to disable unused browser features
            //         { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
            //     ],
            // },
            {
                // Specific headers for /uploads path
                source: '/uploads/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    // You could add more specific headers here if needed
                ],
            }
        ];
    },
};

module.exports = nextConfig;
