import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { publicKey } = body;

    if (!publicKey) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Public key is required' }) };
    }

    const { JWT_SECRET } = process.env;
    if (!JWT_SECRET) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured: JWT_SECRET missing' }) };
    }

    const nonce = randomBytes(32).toString('hex');
    const challengeToken = jwt.sign({ publicKey, nonce }, JWT_SECRET, { expiresIn: '5m' });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, nonce, challengeToken, message: 'Please sign this nonce with your private key' })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to start login process' }) };
  }
};
