import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const { JWT_SECRET } = process.env;
    if (!JWT_SECRET) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured: JWT_SECRET missing' }) };
    }

    const auth = event.headers.authorization || event.headers.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Access token required' }) };
    }

    const token = auth.slice('Bearer '.length);

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Invalid or expired token' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        user: {
          publicKey: payload.publicKey.substring(0, 16) + '...',
          authenticated: true
        }
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to get user info' }) };
  }
};
