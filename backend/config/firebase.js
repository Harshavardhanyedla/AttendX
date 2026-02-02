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

        // STRATEGY 1: Full JSON Env Var (Most Robust)
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                console.log("Firebase: Initializing from FIREBASE_SERVICE_ACCOUNT JSON.");
                credential = _admin.credential.cert(serviceAccount);
            } catch (e) {
                console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e.message);
            }
        }

        // STRATEGY 2: Individual Env Vars (Current)
        if (!credential) {
            let pk = process.env.FIREBASE_PRIVATE_KEY;
            let email = process.env.FIREBASE_CLIENT_EMAIL;
            let project = process.env.FIREBASE_PROJECT_ID;

            if (pk && email && project) {
                // Clean quotes
                const clean = (val) => (val || '').trim().replace(/^["']|["']$/g, '');
                pk = clean(pk);
                email = clean(email);
                project = clean(project);

                // Handle accidental JSON format in Private Key field
                if (pk.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(pk);
                        if (parsed.private_key) pk = parsed.private_key;
                    } catch (e) { }
                }

                // Surgical Repair v2
                // Remove existing headers/footers to access raw body
                let body = pk.replace(/-----BEGIN PRIVATE KEY-----/g, '')
                    .replace(/-----END PRIVATE KEY-----/g, '')
                    .replace(/\s/g, ''); // Remove all whitespace

                // Re-wrap cleanly
                if (body.length > 10) {
                    // Split into 64 char lines
                    const content = body.match(/.{1,64}/g).join('\n');
                    pk = `-----BEGIN PRIVATE KEY-----\n${content}\n-----END PRIVATE KEY-----\n`;
                }

                credential = _admin.credential.cert({
                    projectId: project,
                    clientEmail: email,
                    privateKey: pk,
                });
            }
        }

        // STRATEGY 3: Local File (Fallback)
        if (!credential) {
            const localKeyPath = '/Users/yadlaharshavardhan/Downloads/attendx-e5fbd-firebase-adminsdk-fbsvc-9e6b2d8648.json';
            const pathEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            const finalPath = pathEnv && fs.existsSync(pathEnv) ? pathEnv : localKeyPath;

            if (fs.existsSync(finalPath)) {
                credential = _admin.credential.cert(finalPath);
            }
        }

        if (credential) {
            if (!_admin.apps.length) {
                _admin.initializeApp({ credential });
            }
            _db = _admin.firestore();
        } else {
            throw new Error("No valid credentials found (Checked JSON Env, Split Envs, and Local File)");
        }

    } catch (err) {
        _initError = err.message;
        console.error("Firebase Critical Init Failure:", err.message);
    }

    return { db: _db, admin: _admin };
}

module.exports = {
    get db() {
        const { db } = getFirebase();
        if (!db) throw new Error(_initError || "Firestore not initialized");
        return db;
    },
    get admin() { return getFirebase().admin; },
    get initError() {
        getFirebase();
        return _initError;
    }
};
