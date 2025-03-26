import { NextApiRequest, NextApiResponse } from 'next';
import { console_log } from '../globalLogs.js';

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check endpoints
 * /api/health:
 *   get:
 *     summary: Check the health of the application
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Health status
 *                   example: ok
 *                 time:
 *                   type: string
 *                   description: Current server time in ISO format
 *                   example: 2024-05-17T09:30:00.000Z
 *       500:
 *         description: An error occurred while checking the health
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: An error occurred while checking the health
 */

export async function healthApiHandlerWithContext(req: NextApiRequest, res: NextApiResponse) {
    // You can perform any checks here that you deem necessary to verify
    // the health of your application, such as checking database connectivity
    // or other critical services your application depends on.
    //--------------------------------------
    console_log(0, `APP`, `healthApiHandlerWithContext - Init`);
    //--------------------------------------
    // For a basic health check, simply return a 200 status code and a message.
    res.status(200).json({ status: 'ok', time: new Date().toISOString() });
}
