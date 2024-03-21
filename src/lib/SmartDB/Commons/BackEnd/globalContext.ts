//----------------------------------------------------------------------

// import { NextApiRequest, NextApiResponse } from 'next';
// import { v4 as uuidv4 } from 'uuid';

// export function requestId(req: NextApiRequest, res: NextApiResponse, next: () => void) {
//     req.requestId = uuidv4(); // Attach a unique ID to each request
//     next();
// }

import { createNamespace } from 'cls-hooked';
export const requestContext = createNamespace('requestContext');
