//----------------------------------------------------------------------

import { v4 } from 'uuid';

import { createNamespace } from 'cls-hooked';

let globalState: any;

if (typeof window !== 'undefined') {
    // Client-side environment
    globalState = window;
} else {
    // Server-side environment (Node.js)
    globalState = global;
}

if (!globalState.requestContext) {
    globalState.requestContext = createNamespace('requestContext');
}

export const requestContext = globalState.requestContext;

//----------------------------------------------------------------------

export function requestId() {
    //--------------------------------------
    const requestId = v4();
    //--------------------------------------
    requestContext.set('requestId', requestId);
}

//----------------------------------------------------------------------

