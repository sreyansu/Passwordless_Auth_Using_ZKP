// ZKP Passwordless Authentication Client
// Using Web Crypto API for better browser compatibility

// Global state
let privateKey = null;
let publicKey = null;
let currentNonce = null;
let authToken = null;

/**
 * Generate a new secp256k1 key pair using Web Crypto API
 * This creates the cryptographic foundation for our ZKP system
 */
async function generateKeys() {
    try {
        console.log('Starting key generation...');
        
        // Generate ECDSA key pair using secp256k1 curve
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256", // Using P-256 as secp256k1 isn't widely supported in WebCrypto
            },
            true, // extractable
            ["sign", "verify"]
        );

        // Export the private key
        const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
        const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);

        // Convert to hex strings for display
        const privateKeyHex = Array.from(new Uint8Array(privateKeyBuffer))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        const publicKeyHex = Array.from(new Uint8Array(publicKeyBuffer))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        // Store the key pair
        privateKey = keyPair.privateKey;
        publicKey = publicKeyBuffer; // Store as buffer for API calls

        // Display the keys (truncated for security)
        document.getElementById('privateKey').textContent = privateKeyHex.substring(0, 64) + '...';
        document.getElementById('publicKey').textContent = publicKeyHex.substring(0, 64) + '...';
        document.getElementById('keyDisplay').classList.remove('hidden');

        // Enable registration
        document.getElementById('registerBtn').disabled = false;

        showStatus('globalStatus', 'Key pair generated successfully! 🎉', 'success');
        console.log('Key pair generated successfully');

    } catch (error) {
        console.error('Key generation error:', error);
        showStatus('globalStatus', 'Failed to generate keys: ' + error.message, 'error');
    }
}

/**
 * Register the public key with the server
 */
async function register() {
    if (!publicKey) {
        showStatus('registerStatus', 'Please generate keys first!', 'error');
        return;
    }

    try {
        const publicKeyHex = Array.from(new Uint8Array(publicKey))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                publicKey: publicKeyHex
            })
        });

        const data = await response.json();

        if (data.success) {
            showStatus('registerStatus', `Registration successful! Public key: ${data.publicKey}`, 'success');
            document.getElementById('loginBtn').disabled = false;
        } else {
            showStatus('registerStatus', 'Registration failed: ' + data.error, 'error');
        }

    } catch (error) {
        console.error('Registration error:', error);
        showStatus('registerStatus', 'Registration failed: ' + error.message, 'error');
    }
}

/**
 * Start the login process by requesting a challenge nonce
 */
async function startLogin() {
    if (!publicKey) {
        showStatus('loginStatus', 'Please generate keys and register first!', 'error');
        return;
    }

    try {
        const publicKeyHex = Array.from(new Uint8Array(publicKey))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        const response = await fetch('/login/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                publicKey: publicKeyHex
            })
        });

        const data = await response.json();

        if (data.success) {
            currentNonce = data.nonce;
            document.getElementById('nonce').textContent = currentNonce;
            document.getElementById('nonceDisplay').classList.remove('hidden');
            document.getElementById('finishLoginBtn').classList.remove('hidden');
            document.getElementById('finishLoginBtn').disabled = false;
            
            showStatus('loginStatus', 'Challenge received! Now sign it to prove your identity.', 'info');
        } else {
            showStatus('loginStatus', 'Login start failed: ' + data.error, 'error');
        }

    } catch (error) {
        console.error('Login start error:', error);
        showStatus('loginStatus', 'Login start failed: ' + error.message, 'error');
    }
}

/**
 * Complete the login by creating and sending a signature (ZKP)
 */
async function finishLogin() {
    if (!privateKey || !currentNonce) {
        showStatus('loginStatus', 'Please start login first!', 'error');
        return;
    }

    try {
        // Convert nonce to ArrayBuffer for signing
        const encoder = new TextEncoder();
        const message = encoder.encode(currentNonce);

        // Sign the message using the private key
        const signature = await window.crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" },
            },
            privateKey,
            message
        );

        // Convert signature to hex
        const signatureHex = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        const publicKeyHex = Array.from(new Uint8Array(publicKey))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        // Send the signature to the server for verification
        const response = await fetch('/login/finish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                publicKey: publicKeyHex,
                signature: signatureHex
            })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.token;
            showStatus('loginStatus', `🎉 Authentication successful! Token expires in ${data.expiresIn}.`, 'success');
            
            // Enable protected actions
            document.getElementById('getMeBtn').disabled = false;
            document.getElementById('logoutBtn').disabled = false;
            
            // Hide login elements
            document.getElementById('finishLoginBtn').classList.add('hidden');
            document.getElementById('nonceDisplay').classList.add('hidden');
            
        } else {
            showStatus('loginStatus', 'Authentication failed: ' + data.error, 'error');
        }

    } catch (error) {
        console.error('Login finish error:', error);
        showStatus('loginStatus', 'Authentication failed: ' + error.message, 'error');
    }
}

/**
 * Access a protected resource using the JWT token
 */
async function getMe() {
    if (!authToken) {
        showStatus('userInfo', 'Please login first!', 'error');
        return;
    }

    try {
        const response = await fetch('/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (data.success) {
            const userInfoHtml = `
                <div class="user-info">
                    <h3>👤 Authenticated User</h3>
                    <p><strong>Public Key:</strong> ${data.user.publicKey}</p>
                    <p><strong>Registered:</strong> ${new Date(data.user.registeredAt).toLocaleString()}</p>
                    <p><strong>Status:</strong> ✅ Authenticated via Zero-Knowledge Proof</p>
                </div>
            `;
            document.getElementById('userInfo').innerHTML = userInfoHtml;
        } else {
            showStatus('userInfo', 'Failed to get user info: ' + data.error, 'error');
        }

    } catch (error) {
        console.error('Get user info error:', error);
        showStatus('userInfo', 'Failed to get user info: ' + error.message, 'error');
    }
}

/**
 * Logout and clear the session
 */
function logout() {
    authToken = null;
    currentNonce = null;
    
    // Reset UI state
    document.getElementById('getMeBtn').disabled = true;
    document.getElementById('logoutBtn').disabled = true;
    document.getElementById('finishLoginBtn').classList.add('hidden');
    document.getElementById('nonceDisplay').classList.add('hidden');
    document.getElementById('loginBtn').disabled = false;
    
    // Clear displays
    document.getElementById('userInfo').innerHTML = '';
    document.getElementById('loginStatus').innerHTML = '';
    
    showStatus('globalStatus', 'Logged out successfully!', 'info');
}

/**
 * Helper function to display status messages
 */
function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="status ${type}">${message}</div>`;
}

// Make functions globally available
window.generateKeys = generateKeys;
window.register = register;
window.startLogin = startLogin;
window.finishLogin = finishLogin;
window.getMe = getMe;
window.logout = logout;

// Initialize the demo
console.log('🔐 ZKP Passwordless Authentication Demo loaded!');
console.log('Click "Generate New Key Pair" to start the demo.');