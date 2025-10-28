import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
// Using Web Crypto API instead of external libraries
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage for demo purposes
const users = new Map(); // publicKey -> { publicKey, nonce }
const sessions = new Map(); // publicKey -> { token, expires }

/**
 * Zero-Knowledge Proof Implementation using Schnorr Signatures
 * 
 * How it works:
 * 1. Client generates a key pair (private key sk, public key pk = sk * G)
 * 2. To prove ownership of sk without revealing it:
 *    - Server sends a random challenge (nonce)
 *    - Client creates a Schnorr signature: sign(nonce, sk)
 *    - Server verifies: verify(signature, nonce, pk)
 * 3. If verification passes, client proved they know sk without revealing it
 */

// Helper function to generate random nonce
function generateNonce() {
    return crypto.randomBytes(32).toString('hex');
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// API Endpoints

/**
 * POST /register
 * Register a new user with their public key
 */
app.post('/register', async (req, res) => {
    try {
        const { publicKey } = req.body;

        if (!publicKey) {
            return res.status(400).json({ error: 'Public key is required' });
        }

        // Validate public key format (SPKI format is longer than secp256k1)
        if (!/^[0-9a-fA-F]+$/.test(publicKey) || publicKey.length < 100) {
            return res.status(400).json({ error: 'Invalid public key format' });
        }

        // Check if user already exists
        if (users.has(publicKey)) {
            return res.status(409).json({ error: 'User already registered' });
        }

        // Store user
        users.set(publicKey, {
            publicKey,
            nonce: null,
            registeredAt: new Date().toISOString()
        });

        console.log(`User registered with public key: ${publicKey.substring(0, 16)}...`);

        res.json({
            success: true,
            message: 'User registered successfully',
            publicKey: publicKey.substring(0, 16) + '...' // Return truncated for privacy
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * POST /login/start
 * Start the login process by generating a nonce challenge
 */
app.post('/login/start', (req, res) => {
    try {
        const { publicKey } = req.body;

        if (!publicKey) {
            return res.status(400).json({ error: 'Public key is required' });
        }

        // Check if user exists
        const user = users.get(publicKey);
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please register first.' });
        }

        // Generate a random nonce (challenge)
        const nonce = generateNonce();

        // Store nonce for this user
        user.nonce = nonce;
        users.set(publicKey, user);

        console.log(`Login challenge generated for user: ${publicKey.substring(0, 16)}...`);

        res.json({
            success: true,
            nonce,
            message: 'Please sign this nonce with your private key'
        });

    } catch (error) {
        console.error('Login start error:', error);
        res.status(500).json({ error: 'Failed to start login process' });
    }
});

/**
 * POST /login/finish
 * Complete the login by verifying the Schnorr signature (ZKP)
 */
app.post('/login/finish', async (req, res) => {
    try {
        const { publicKey, signature } = req.body;

        if (!publicKey || !signature) {
            return res.status(400).json({ error: 'Public key and signature are required' });
        }

        // Get user and nonce
        const user = users.get(publicKey);
        if (!user || !user.nonce) {
            return res.status(400).json({ error: 'No active login session. Please start login first.' });
        }

        // Convert nonce to bytes for verification
        const encoder = new TextEncoder();
        const message = encoder.encode(user.nonce);

        // Convert hex strings back to ArrayBuffers
        const signatureBuffer = Buffer.from(signature, 'hex');
        const publicKeyBuffer = Buffer.from(publicKey, 'hex');

        // Import the public key for verification
        const cryptoPublicKey = await crypto.subtle.importKey(
            'spki',
            publicKeyBuffer,
            {
                name: 'ECDSA',
                namedCurve: 'P-256',
            },
            false,
            ['verify']
        );

        // Verify the ECDSA signature (Zero-Knowledge Proof)
        // This proves the client knows the private key without revealing it
        const isValid = await crypto.subtle.verify(
            {
                name: 'ECDSA',
                hash: { name: 'SHA-256' },
            },
            cryptoPublicKey,
            signatureBuffer,
            message
        );

        if (!isValid) {
            // Clear the nonce on failed attempt
            user.nonce = null;
            users.set(publicKey, user);

            return res.status(401).json({ error: 'Invalid signature. Authentication failed.' });
        }

        // Clear the nonce after successful verification
        user.nonce = null;
        users.set(publicKey, user);

        // Generate JWT token (15 minutes expiry)
        const token = jwt.sign(
            {
                publicKey,
                iat: Math.floor(Date.now() / 1000)
            },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Store session
        sessions.set(publicKey, {
            token,
            expires: Date.now() + (15 * 60 * 1000) // 15 minutes
        });

        console.log(`User authenticated successfully: ${publicKey.substring(0, 16)}...`);

        res.json({
            success: true,
            token,
            message: 'Authentication successful',
            expiresIn: '15 minutes'
        });

    } catch (error) {
        console.error('Login finish error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

/**
 * GET /me
 * Get current authenticated user information
 */
app.get('/me', authenticateToken, (req, res) => {
    const { publicKey } = req.user;
    const user = users.get(publicKey);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        success: true,
        user: {
            publicKey: publicKey.substring(0, 16) + '...',
            registeredAt: user.registeredAt,
            authenticated: true
        }
    });
});

// Serve the client HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        users: users.size,
        activeSessions: sessions.size
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ZKP Passwordless Auth Server running on http://localhost:${PORT}`);
    console.log(`📝 Open http://localhost:${PORT} to test the demo`);
});