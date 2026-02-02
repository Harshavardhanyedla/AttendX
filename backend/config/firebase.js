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
            const clean = (val) => (val || '').trim().replace(/^["']|["']$/g, '');
            pk = clean(pk);
            email = clean(email);
            project = clean(project);

            // Handle accidental JSON copy-paste
            if (pk.startsWith('{')) {
                try {
                    const parsed = JSON.parse(pk);
                    if (parsed.private_key) pk = parsed.private_key;
                } catch (e) {
                    // ignore
                }
            }

            // Universal Newline Fixer
            // 1. Replace literal "\n" strings with real newlines
            pk = pk.replace(/\\n/g, '\n');

            // 2. Ensure headers have adjacent newlines (fix one-liner paste)
            if (!pk.includes('\n')) {
                // Aggressive: It's a one-liner. Try to split by header/footer.
                pk = pk.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
                pk = pk.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');

                // If that didn't create newlines, maybe it's space-separated?
                // (Rare, but let's try to fix standard spacing if headers are fixed)
                pk = pk.replace(/ ([A-Za-z0-9+/=]{64}) /g, '\n$1\n');
            }

            // 3. One last cleanup to ensure clean headers
            pk = pk.replace(/-----BEGIN PRIVATE KEY-----\s*/, '-----BEGIN PRIVATE KEY-----\n');
            pk = pk.replace(/\s*-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----');

            if (!pk.includes('-----BEGIN PRIVATE KEY-----')) {
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

            // Allow override via path env var (e.g. for Render/others)
            const pathEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            const finalPath = pathEnv && fs.existsSync(pathEnv) ? pathEnv : localKeyPath;

            if (fs.existsSync(finalPath)) {
                credential = _admin.credential.cert(finalPath);
            } else {
                throw new Error(`Missing Env Vars. Project=${!!project}, Email=${!!email}, Key=${!!pk}`);
            }
        }

        if (credential) {
            // Check if already initialized to avoid duplicate app errors
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
