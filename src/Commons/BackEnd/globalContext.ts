//----------------------------------------------------------------------

import { v4 } from 'uuid';

import { createNamespace } from 'cls-hooked';
export const requestContext = createNamespace('requestContext');

//----------------------------------------------------------------------

export function requestId() {
    //--------------------------------------
    const requestId = v4();
    //--------------------------------------
    requestContext.set('requestId', requestId);
}

//----------------------------------------------------------------------
