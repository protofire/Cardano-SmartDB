module.exports = {
    parser: 'postcss-scss',
    plugins: [
        require('postcss-import'), // Resolve @import statements first
        require('postcss-nested'), // Flatten nested selectors
        require('autoprefixer')(),
        require('cssnano')({ preset: 'default' }), // Optional, for minifying CSS
    ]
};
