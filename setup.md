# Quick Setup & Test Instructions

## 🚀 Start the Demo

1. **Install dependencies** (if not done already):
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Open the demo**:
   - Go to: http://localhost:3000
   - Or test key generation first: http://localhost:3000/test-keygen.html

## 🧪 Testing Steps

### In the Browser (http://localhost:3000):

1. **Click "Generate New Key Pair"**
   - Should show private and public keys
   - Enable the Register button

2. **Click "Register Public Key"**
   - Should show success message
   - Enable the Login button

3. **Click "Start Login"**
   - Should show challenge nonce
   - Enable "Complete Login" button

4. **Click "Complete Login"**
   - Should show authentication success
   - Enable "Get My Info" button

5. **Click "Get My Info"**
   - Should show authenticated user details

## 🔧 Troubleshooting

If key generation doesn't work:

1. **Check browser console** (F12 → Console tab)
2. **Try the test page**: http://localhost:3000/test-keygen.html
3. **Verify server is running**: curl http://localhost:3000/health

## 📋 Expected Flow

```
Generate Keys → Register → Start Login → Complete Login → Access Protected Resource
     ↓              ↓           ↓              ↓                    ↓
  Key pair      Public key   Challenge      ZK Proof           JWT Token
  created       stored       received       verified           issued
```

## 🔐 What's Happening

- **No passwords** are used anywhere
- **Private key never leaves your browser**
- **Zero-knowledge proof** via Schnorr signatures
- **Server verifies** without seeing private key
- **Pure cryptographic authentication**

The magic: You prove you own the private key without revealing it! 🎉