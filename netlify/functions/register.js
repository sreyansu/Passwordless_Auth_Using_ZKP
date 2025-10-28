import jwt from 'jsonwebtoken';

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
    const { publicKey } = body;

    if (!publicKey) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Public key is required' }) };
    }

    if (!/^[0-9a-fA-F]+$/.test(publicKey) || publicKey.length < 100) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid public key format' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'User registered successfully', publicKey: `${publicKey.substring(0,16)}...` })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Registration failed' }) };
  }
};
