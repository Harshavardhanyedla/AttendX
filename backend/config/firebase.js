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

            // AGGRESSIVE KEY REPAIR
            // 1. Convert literal \n to real newlines
            // 2. Ensure headers are clean
            if (!pk.includes('\n') && pk.includes('\\n')) {
                pk = pk.replace(/\\n/g, '\n');
            }

            // Sometimes copy-paste results in spaces instead of newlines for the header/footer
            pk = pk.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
            pk = pk.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');

            // Remove double newlines if we created them
            pk = pk.replace(/\n\n/g, '\n');

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
            if (fs.existsSync(localKeyPath)) {
                credential = _admin.credential.cert(localKeyPath);
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
