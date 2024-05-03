import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // You can perform any checks here that you deem necessary to verify
  // the health of your application, such as checking database connectivity
  // or other critical services your application depends on.

  // For a basic health check, simply return a 200 status code and a message.
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
}