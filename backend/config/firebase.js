const fs = require('fs');

let _admin;
let _db;
let _initError = null;

function getFirebase() {
    if (_admin && _db) return { db: _db, admin: _admin };
    if (_initError) return { db: null, admin: null }; // fast fail

    try {
        _admin = require('firebase-admin');

        let credential;
        // Priority 1: Check Env Vars (Production)
        let pk = process.env.FIREBASE_PRIVATE_KEY;
        let email = process.env.FIREBASE_CLIENT_EMAIL;
        let project = process.env.FIREBASE_PROJECT_ID;

        if (pk && email && project) {
            // Clean quotes
            const clean = (val) => (val || '').trim().replace(/^["']|["']$/g, '');
            pk = clean(pk);
            email = clean(email);
            project = clean(project);

            // Handle accidental JSON format
            if (pk.startsWith('{')) {
                try {
                    const parsed = JSON.parse(pk);
                    if (parsed.private_key) pk = parsed.private_key;
                } catch (e) { }
            }

            // Universal Fixer: Extract *only* the valid key part
            // This ignores any trailing/leading garbage that causes "Unparsed DER bytes"
            if (pk.includes('-----BEGIN PRIVATE KEY-----') && pk.includes('-----END PRIVATE KEY-----')) {
                // Replace literal \n with spaces first to treat as one block, or just standardizer
                // Actually, best is to just standardise newlines first
                pk = pk.replace(/\\n/g, '\n');

                // Regex to find the core content
                const match = pk.match(/-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/);
                if (match) {
                    // Reassemble cleanly
                    let body = match[1].replace(/\s/g, ''); // Remove ALL whitespace from body
                    // Split body into 64-char chunks (standard PEM)
                    body = body.match(/.{1,64}/g).join('\n');
                    pk = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`;
                }
            } else {
                throw new Error("Private Key is missing '-----BEGIN PRIVATE KEY-----' header.");
            }

            credential = _admin.credential.cert({
                projectId: project,
                clientEmail: email,
                privateKey: pk,
            });
        } else {
            // Local fallback
            const localKeyPath = '/Users/yadlaharshavardhan/Downloads/attendx-e5fbd-firebase-adminsdk-fbsvc-9e6b2d8648.json';
            const pathEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            const finalPath = pathEnv && fs.existsSync(pathEnv) ? pathEnv : localKeyPath;

            if (fs.existsSync(finalPath)) {
                credential = _admin.credential.cert(finalPath);
            } else {
                throw new Error(`Missing Env Vars. Project=${!!project}, Email=${!!email}, Key=${!!pk}`);
            }
        }

        if (credential) {
            if (!_admin.apps.length) {
                _admin.initializeApp({ credential });
            }
            _db = _admin.firestore();
        }
    } catch (err) {
        _initError = err.message; // Capture error
        console.error("Firebase Critical Init Failure:", err.message);
    }

    return { db: _db, admin: _admin };
}

module.exports = {
    get db() {
        const { db } = getFirebase();
        if (!db) throw new Error(_initError || "Firestore not initialized (Unknown reason)");
        return db;
    },
    get admin() { return getFirebase().admin; },
    get initError() {
        getFirebase();
        return _initError;
    }
};
