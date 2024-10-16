const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const myEnv = dotenv.config({ path: './.env.local' });
dotenvExpand.expand(myEnv);

const { TextEncoder, TextDecoder } = require('util'); // Usar la implementación nativa de Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.XMLHttpRequest = class extends XMLHttpRequest {
    open(method, url) {
        const apiUrl = process.env.NEXT_PUBLIC_REACT_SERVER_API_URL; // Usa la variable expandida
        url = url.replace('$NEXT_PUBLIC_REACT_SERVER_API_URL', apiUrl);
        // console.log('[TEST] - XMLHttpRequest ' + method + ' ' + url);
        super.open(method, url);
    }
};
