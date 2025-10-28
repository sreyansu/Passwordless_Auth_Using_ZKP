import { users, sessions } from './_shared/store.js';
import jwt from 'jsonwebtoken';
import { webcrypto } from 'node:crypto';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const { JWT_SECRET } = process.env;
    if (!JWT_SECRET) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured: JWT_SECRET missing' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { publicKey, signature } = body;

    if (!publicKey || !signature) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Public key and signature are required' }) };
    }

    const user = users.get(publicKey);
    if (!user || !user.nonce) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No active login session. Please start login first.' }) };
    }

    // Prepare inputs
    const encoder = new TextEncoder();
    const message = encoder.encode(user.nonce);
    const signatureBuffer = Buffer.from(signature, 'hex');
    const publicKeyBuffer = Buffer.from(publicKey, 'hex');

    // Import the SPKI public key
    const cryptoPublicKey = await webcrypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );

    // Verify signature
    const isValid = await webcrypto.subtle.verify(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      cryptoPublicKey,
      signatureBuffer,
      message
    );

    if (!isValid) {
      user.nonce = null;
      users.set(publicKey, user);
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature. Authentication failed.' }) };
    }

    // Clear nonce and issue JWT
    user.nonce = null;
    users.set(publicKey, user);

    const token = jwt.sign({ publicKey, iat: Math.floor(Date.now() / 1000) }, JWT_SECRET, { expiresIn: '15m' });
    sessions.set(publicKey, { token, expires: Date.now() + 15 * 60 * 1000 });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, token, message: 'Authentication successful', expiresIn: '15 minutes' })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Authentication failed' }) };
  }
};
