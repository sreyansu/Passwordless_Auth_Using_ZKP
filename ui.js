// UI Management Functions
function switchTab(tab) {
    const registerTab = document.getElementById('registerTab');
    const loginTab = document.getElementById('loginTab');
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const loggedInView = document.getElementById('loggedInView');

    if (tab === 'register') {
        registerTab.classList.add('bg-indigo-600', 'text-white');
        loginTab.classList.remove('bg-indigo-600', 'text-white');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        loggedInView.classList.add('hidden');
    } else {
        loginTab.classList.add('bg-indigo-600', 'text-white');
        registerTab.classList.remove('bg-indigo-600', 'text-white');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loggedInView.classList.add('hidden');
    }
}

function showMessage(message, isError = false) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.classList.remove('hidden', 'bg-green-100', 'text-green-700', 'bg-red-100', 'text-red-700');
    messageBox.classList.add(
        isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
    );
}

function addToLog(message, highlight = false) {
    const liveLog = document.getElementById('liveLog');
    const entry = document.createElement('div');
    entry.textContent = message;
    if (highlight) {
        entry.classList.add('bg-yellow-100', 'p-1', 'rounded');
    }
    liveLog.appendChild(entry);
    liveLog.scrollTop = liveLog.scrollHeight;
}

function updateServerDatabase() {
    const dbElement = document.getElementById('serverDatabase');
    console.log('Current database state:', window.serverDatabase);  // Debug log
    const prettyJson = JSON.stringify(window.serverDatabase, null, 2);
    dbElement.textContent = prettyJson || 'No users registered';
    
    // Apply monospace formatting and ensure visibility
    dbElement.style.fontFamily = 'monospace';
    dbElement.style.whiteSpace = 'pre';
    dbElement.style.minHeight = '100px';
}

function showProtocolDetails() {
    const logContent = document.getElementById('liveLog').innerHTML;
    const detailsWindow = window.open('', '_blank', 'width=600,height=800');
    detailsWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ZKP Protocol Details</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Inter', sans-serif;
                    padding: 2rem;
                    background: #f9fafb;
                    line-height: 1.6;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .highlight {
                    background: #fff9c2;
                    padding: 4px;
                    border-radius: 4px;
                }
                pre {
                    background: #f8fafc;
                    padding: 1rem;
                    border-radius: 6px;
                    overflow-x: auto;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Zero-Knowledge Proof Protocol Details</h1>
                <h2>Authentication Steps:</h2>
                <pre>${logContent}</pre>
            </div>
        </body>
        </html>
    `);
    detailsWindow.document.close();
}

function logout() {
    // Fade out effect
    const loggedInView = document.getElementById('loggedInView');
    loggedInView.style.opacity = '1';
    loggedInView.style.transition = 'opacity 0.3s ease-out';
    
    setTimeout(() => {
        loggedInView.style.opacity = '0';
        setTimeout(() => {
            loggedInView.classList.add('hidden');
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('loginForm').reset();
            document.getElementById('messageBox').classList.add('hidden');
            document.getElementById('liveLog').innerHTML = '';
            loggedInView.style.transition = '';
            loggedInView.style.opacity = '';
        }, 300);
    }, 0);
}

// Event Listeners
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const pin = BigInt(document.getElementById('regPin').value);

    const result = await handleRegistration(username, pin);
    showMessage(result.message, !result.success);
    if (result.success) {
        this.reset();
    }
});

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const pin = BigInt(document.getElementById('loginPin').value);

    const result = await handleLogin(username, pin);
    showMessage(result.message, !result.success);
    
    if (result.success) {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('loggedInView').classList.remove('hidden');
    }
});

// Initialize UI
document.addEventListener('DOMContentLoaded', function() {
    switchTab('register');
    updateServerDatabase();
    console.log('Initial database state:', window.serverDatabase);  // Debug log
});