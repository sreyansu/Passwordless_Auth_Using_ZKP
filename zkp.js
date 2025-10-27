const p = 1117n;
const g = 5n;

window.serverDatabase = window.serverDatabase || {};

function modPow(base, exponent, modulus) {
    if (modulus === 1n) return 0n;
    let result = 1n;
    base = base % modulus;
    while (exponent > 0n) {
        if (exponent % 2n === 1n) result = (result * base) % modulus;
        base = (base * base) % modulus;
        exponent = exponent / 2n;
    }
    return result;
}

function getRandomBigInt(min, max) {
    const range = max - min + 1n;
    const bits = range.toString(2).length;
    let value;
    do {
        value = 0n;
        for (let i = 0; i < bits; i++) {
            value = (value << 1n) + BigInt(Math.random() < 0.5);
        }
    } while (value >= range);
    return value + min;
}

async function handleRegistration(username, pin) {
    if (window.serverDatabase[username]) {
        return { success: false, message: 'Username already exists!' };
    }

    addToLog('Registration Started...');
    addToLog(`CLIENT: Using PIN as secret x (never sent to server)`);

    const v = modPow(g, pin, p);
    addToLog(`CLIENT: Calculating v = g^x mod p = ${v}`);

    window.serverDatabase[username] = { v: v.toString() };
    addToLog('SERVER: Storing public value v in database');
    updateServerDatabase();

    console.log(`✅ Stored: username=${username}, v=${v}`);
    return { success: true, message: 'Registration successful!' };
}

async function handleLogin(username, pin) {
    if (!window.serverDatabase[username]) {
        return { success: false, message: 'User not found!' };
    }

    document.getElementById('liveLog').innerHTML = '';
    addToLog('Login Protocol Started...', true);

    const r = getRandomBigInt(1n, p - 1n);
    const y1 = modPow(g, r, p);
    addToLog('Step 1: Client Commitment', true);
    addToLog(`CLIENT: Generated random r (kept secret)`);
    addToLog(`CLIENT: Calculated y1 = g^r mod p = ${y1}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const c = getRandomBigInt(1n, p - 1n);
    addToLog('Step 2: Server Challenge', true);
    addToLog(`SERVER: Generated random challenge c = ${c}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const y2 = r + c * pin;
    addToLog('Step 3: Client Response', true);
    addToLog(`CLIENT: Calculating proof y2 = r + c*x = ${y2}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    addToLog('Step 4: Server Verification', true);
    const v = BigInt(window.serverDatabase[username].v);
    const left = modPow(g, y2, p);
    const right = (y1 * modPow(v, c, p)) % p;

    addToLog(`SERVER: Checking if g^y2 mod p = (y1 * v^c) mod p`);
    addToLog(`SERVER: Left side = ${left}`);
    addToLog(`SERVER: Right side = ${right}`);
    addToLog(`SERVER: Stored v value = ${v}`);
    addToLog(`SERVER: Attempted proof with y2 = ${y2}`);

    const gToY2 = modPow(g, y2, p);
    const vToC = modPow(v, c, p);
    addToLog(`SERVER: Detailed verification steps:`);
    addToLog(`1. g^y2 mod p = ${gToY2}`);
    addToLog(`2. v^c mod p = ${vToC}`);
    addToLog(`3. y1 = ${y1}`);
    addToLog(`4. (y1 * v^c) mod p = ${right}`);

    if (left === right) {
        addToLog('SERVER: ✅ Verification SUCCESSFUL!', true);
        return {
            success: true,
            message: 'Authentication successful!'
        };
    } else {
        addToLog('SERVER: ❌ Verification FAILED!', true);
        return {
            success: false,
            message: 'Authentication failed!'
        };
    }
}