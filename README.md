# Zero-Knowledge Proof Authentication Demo

This project demonstrates passwordless authentication using a Zero-Knowledge Proof (ZKP) protocol, specifically implementing the Schnorr protocol. The application allows users to register and authenticate without ever sending their actual PIN/password to the server, showcasing the power of ZKP in modern authentication systems.

## Understanding Zero-Knowledge Proof

A Zero-Knowledge Proof is a method where one party (the Prover) can prove to another party (the Verifier) that they know a value x, without conveying any information apart from the fact that they know the value x.

### How Our ZKP Implementation Works

We use the Schnorr protocol, which works as follows:

#### Registration Phase
```
Given: 
- Public parameters: prime p = 1117, generator g = 5
- User's secret: PIN (x)

1. Client computes: v = g^x mod p
2. Server stores: only v (public key)

Example:
If PIN = 1234
v = 5^1234 mod 1117
Server only knows v, not the PIN
```

#### Login Phase (Interactive Proof)
```
Step 1 - Client Commitment:
- Client generates random r
- Computes y1 = g^r mod p
- Sends y1 to server

Step 2 - Server Challenge:
- Server generates random challenge c
- Sends c to client

Step 3 - Client Response:
- Client computes y2 = r + c*x
- Sends y2 to server

Step 4 - Server Verification:
- Server checks if g^y2 mod p = (y1 * v^c) mod p
```

### Real-World Example

Let's walk through a complete example:

```
Registration:
1. User chooses PIN = 1234
2. Client calculates v = 5^1234 mod 1117
3. Server stores v = 892 (example value)

Login Process:
1. Client Commitment:
   - Generates random r = 50
   - Calculates y1 = 5^50 mod 1117 = 351

2. Server Challenge:
   - Generates random c = 93

3. Client Response:
   - Calculates y2 = 50 + (93 * 1234) = 114,812

4. Server Verification:
   - Checks if 5^114812 mod 1117 equals (351 * 892^93) mod 1117
   - If equal, authentication succeeds!
```

### Security Properties

1. Zero-Knowledge: The server never learns the PIN
2. Soundness: Cannot authenticate without knowing the correct PIN
3. Completeness: Correct PIN always authenticates successfully

### Why It's Secure

- Even if an attacker intercepts all communication, they cannot:
  - Recover the original PIN
  - Reuse the proof (because c is random each time)
  - Generate a valid proof without knowing the PIN

## Features

- **Passwordless Authentication**: Uses Zero-Knowledge Proofs instead of traditional password transmission
- **Interactive Demo**: Step-by-step visualization of the ZKP protocol in action
- **Real-time Logging**: See exactly what's happening during the authentication process
- **Clean UI**: Modern, responsive interface built with Tailwind CSS
- **Pure JavaScript**: No external JS dependencies, uses native BigInt for cryptographic calculations

## Technology Stack

- **HTML5**: Structure and content
- **Tailwind CSS**: Styling and layout (loaded via CDN)
- **Vanilla JavaScript**: All logic and cryptographic calculations
- **Inter Font**: Modern typography

## Project Structure

```
.
├── README.md
├── index.html      # Main HTML file
├── styles.css      # Custom styles beyond Tailwind
├── zkp.js          # ZKP protocol implementation
└── ui.js           # UI management and event handlers
```

## How It Works

### Registration Process

1. User enters a username and a 4-digit PIN
2. Client calculates v = g^x mod p (where x is the PIN)
3. Only the public value v is stored in the server database
4. The PIN (secret x) is never transmitted or stored

### Login Process (Schnorr Protocol)

1. **Client Commitment**:
   - Client generates random r
   - Calculates y1 = g^r mod p
   - Sends y1 to server

2. **Server Challenge**:
   - Server generates random challenge c
   - Sends c to client

3. **Client Response**:
   - Client calculates proof y2 = r + c*x
   - Sends y2 to server

4. **Server Verification**:
   - Server checks if g^y2 mod p = (y1 * v^c) mod p
   - If equal, authentication succeeds

## Security Features

- Uses cryptographically secure random number generation
- Implements efficient modular exponentiation
- Never stores or transmits the actual PIN
- All cryptographic calculations use JavaScript's native BigInt type

### ZKP vs Traditional Passwords

#### Traditional Password Authentication
1. **Storage**: 
   - Server stores hashed passwords in database
   - Even hashed passwords can be vulnerable to rainbow table attacks
   - If database is breached, all hashed passwords are exposed

2. **Transmission**:
   - Password is sent to server (even if encrypted during transit)
   - Vulnerable to man-in-the-middle attacks
   - Each login attempt transmits sensitive data

3. **Verification**:
   - Server compares stored hash with hash of submitted password
   - Server must process actual password data
   - Password exists in server memory during verification

#### Zero-Knowledge Proof Authentication
1. **Storage**:
   - Server only stores public value (v = g^x mod p)
   - No password or hash is ever stored
   - Database breach reveals no sensitive information

2. **Transmission**:
   - PIN/password never leaves the client
   - Only mathematical proofs are transmitted
   - Each login uses different random values

3. **Verification**:
   - Server verifies mathematical relationship
   - Server never sees or processes the actual PIN
   - Nothing sensitive exists in server memory

#### Key Advantages of ZKP
- **True Zero Knowledge**: Server can verify without knowing the secret
- **No Password Database**: Nothing to steal in a breach
- **Dynamic Proofs**: Each login generates unique values
- **Mathematical Security**: Based on hard mathematical problems
- **Future-Proof**: Resistant to quantum computing attacks

#### Example Comparison
```
Traditional Password:
1. User enters password "1234"
2. Password is hashed: hash("1234") = "e7df7cd2ca07f4f1ab415d457a6e1c13"
3. Hash is sent to server
4. Server compares received hash with stored hash

ZKP Authentication:
1. User enters PIN "1234"
2. PIN never leaves the device
3. Client proves knowledge of PIN through mathematical proof
4. Server verifies proof without knowing PIN
```

## Getting Started

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Try registering a new user with a 4-digit PIN
4. Observe the server database (right panel) storing only the public value
5. Try logging in and watch the ZKP protocol in action

## Development

To modify or enhance the project:

1. **HTML Changes**: Edit `index.html` for structure modifications
2. **Styling**: Add custom styles to `styles.css`
3. **ZKP Logic**: Modify `zkp.js` for protocol changes
4. **UI Behavior**: Update `ui.js` for interface modifications

## Browser Compatibility

The application requires a modern browser that supports:
- ES6+ JavaScript
- BigInt type
- CSS Grid
- Flexbox

## Educational Value

This demo is particularly useful for:
- Understanding Zero-Knowledge Proof concepts
- Learning about cryptographic protocols
- Seeing real-world applications of modular arithmetic
- Studying modern web authentication methods

## Security Note

This is a demonstration project and should not be used in production without proper security auditing and hardening. The implementation is simplified for educational purposes.