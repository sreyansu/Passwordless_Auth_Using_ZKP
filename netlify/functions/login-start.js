import { users } from './_shared/store.js';
import { randomBytes } from 'crypto';

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

    const user = users.get(publicKey);
    if (!user) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found. Please register first.' }) };
    }

    const nonce = randomBytes(32).toString('hex');
    user.nonce = nonce;
    users.set(publicKey, user);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, nonce, message: 'Please sign this nonce with your private key' })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to start login process' }) };
  }
};
