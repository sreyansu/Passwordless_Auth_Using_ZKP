# ZKP Passwordless Authentication Demo

A complete demonstration of passwordless authentication using **Zero-Knowledge Proof (ZKP)** with Schnorr signatures and the Fiat-Shamir transform.

## 🔐 How Zero-Knowledge Proof Works

This demo implements a **Schnorr proof of private-key ownership** where:

1. **Client generates a key pair** (private key `sk`, public key `pk = sk * G`)
2. **Registration**: Client sends `pk` to server (no password needed!)
3. **Authentication Challenge**: Server generates a random nonce
4. **Zero-Knowledge Proof**: Client signs the nonce with `sk` (Schnorr signature)
5. **Verification**: Server verifies the signature using `pk`
6. **Success**: If valid, client proved they know `sk` without revealing it!

### The Magic ✨

The client **proves ownership of the private key without ever revealing it**. The server can verify the proof using only the public key. No passwords, no secrets shared!

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Open the demo:**
   Navigate to `http://localhost:3000` in your browser

## 🎯 Demo Flow

### Step 1: Generate Key Pair
- Click "Generate New Key Pair"
- Creates a secp256k1 private/public key pair
- Private key stays in browser (never sent to server!)

### Step 2: Register
- Click "Register Public Key"
- Sends only the public key to server
- No username or password required!

### Step 3: Login (ZKP Authentication)
- Click "Start Login" → Server sends random challenge nonce
- Click "Complete Login" → Browser signs nonce with private key
- Server verifies signature using stored public key
- Success = JWT token issued!

### Step 4: Access Protected Resources
- Click "Get My Info" to access authenticated endpoint
- JWT token proves you're authenticated
- Click "Logout" to clear session

## 🏗️ Architecture

### Backend (`server.js`)
- **Express.js** server with CORS enabled
- **Web Crypto API** for cryptographic operations
- **jsonwebtoken** for session management
- In-memory storage for demo (no database needed)

### Frontend (`public/index.html`)
- Vanilla HTML/CSS/JavaScript
- **Web Crypto API** (built into browsers) for client-side crypto
- Responsive design with step-by-step UI

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /register` | Register public key |
| `POST /login/start` | Get challenge nonce |
| `POST /login/finish` | Submit ZKP signature |
| `GET /me` | Access protected resource |
| `GET /health` | Server health check |

## 🔧 Technical Details

### Cryptography Stack
- **Curve**: P-256 (NIST standard, widely supported)
- **Signature Scheme**: ECDSA signatures
- **Hash Function**: SHA-256
- **Key Format**: SPKI format public keys
- **API**: Web Crypto API (built into browsers)

### Security Features
- **JWT Expiry**: 15 minutes (configurable)
- **Nonce Validation**: Single-use challenges
- **CORS Protection**: Configurable origins
- **Input Validation**: Public key format verification

### Zero-Knowledge Proof Implementation

```javascript
// Client side - Create proof
const encoder = new TextEncoder();
const message = encoder.encode(nonce);
const signature = await crypto.subtle.sign(
  { name: "ECDSA", hash: { name: "SHA-256" } },
  privateKey,
  message
);

// Server side - Verify proof  
const isValid = await crypto.subtle.verify(
  { name: "ECDSA", hash: { name: "SHA-256" } },
  publicKey,
  signature,
  message
);
```

This is a **non-interactive zero-knowledge proof** using the Fiat-Shamir transform:
- The random nonce acts as the "challenge"
- The signature is the "response" 
- No interaction needed beyond the initial challenge

## 🛡️ Security Considerations

### Production Readiness Checklist
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Add proper database with encryption
- [ ] Use environment variables for secrets
- [ ] Add request logging and monitoring
- [ ] Implement proper error handling
- [ ] Add input sanitization
- [ ] Consider key rotation mechanisms

### Current Limitations (Demo Only)
- In-memory storage (data lost on restart)
- No rate limiting
- Simple JWT secret (change in production)
- No HTTPS (use reverse proxy in production)

## 🧪 Testing the Demo

1. **Generate Keys**: Creates cryptographic key pair
2. **Register**: Stores public key on server
3. **Login**: Proves private key ownership via signature
4. **Access**: Uses JWT for authenticated requests
5. **Logout**: Clears session and tokens

Try multiple users by generating different key pairs!

## 📚 Learn More

### Zero-Knowledge Proofs
- [Zero-Knowledge Proofs: An Illustrated Primer](https://blog.cryptographyengineering.com/2014/11/27/zero-knowledge-proofs-illustrated-primer/)
- [Schnorr Signatures Explained](https://medium.com/coinmonks/schnorr-signatures-explained-3d2b5b2d2c8c)

### Cryptography
- [@noble/secp256k1 Documentation](https://github.com/paulmillr/noble-secp256k1)
- [Elliptic Curve Cryptography](https://andrea.corbellini.name/2015/05/17/elliptic-curve-cryptography-a-gentle-introduction/)

