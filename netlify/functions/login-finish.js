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
    const { publicKey, signature, challengeToken } = body;

    if (!publicKey || !signature || !challengeToken) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Public key, signature and challengeToken are required' }) };
    }

    // Verify the challenge token (contains { publicKey, nonce })
    let payload;
    try {
      payload = jwt.verify(challengeToken, JWT_SECRET);
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid or expired challenge token' }) };
    }

    if (payload.publicKey !== publicKey) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Public key does not match challenge' }) };
    }

    // Prepare inputs
    const encoder = new TextEncoder();
    const message = encoder.encode(payload.nonce);
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
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature. Authentication failed.' }) };
    }

    // Issue auth token (no server-side session)
    const token = jwt.sign({ publicKey, iat: Math.floor(Date.now() / 1000) }, JWT_SECRET, { expiresIn: '15m' });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, token, message: 'Authentication successful', expiresIn: '15 minutes' })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Authentication failed' }) };
  }
};
