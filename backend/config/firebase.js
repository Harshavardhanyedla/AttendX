const fs = require('fs');

let _admin;
let _db;

function getFirebase() {
    if (_admin) return { db: _db, admin: _admin };

    try {
        _admin = require('firebase-admin');

        let credential;
        const localKeyPath = '/Users/yadlaharshavardhan/Downloads/attendx-e5fbd-firebase-adminsdk-fbsvc-9e6b2d8648.json';

        if (fs.existsSync(localKeyPath)) {
            console.log("Firebase: Using local JSON.");
            credential = _admin.credential.cert(localKeyPath);
        } else if (process.env.FIREBASE_PRIVATE_KEY) {
            console.log("Firebase: Initializing from Env Vars.");

            // Extreme cleaning of keys
            const clean = (val) => (val || '').trim().replace(/^["']|["']$/g, '');

            let pk = clean(process.env.FIREBASE_PRIVATE_KEY);
            // Handle escaped newlines
            pk = pk.split('\\n').join('\n');

            const email = clean(process.env.FIREBASE_CLIENT_EMAIL);
            const project = clean(process.env.FIREBASE_PROJECT_ID);

            if (!pk.includes('-----BEGIN PRIVATE KEY-----')) {
                throw new Error("Private Key missing header. Check your Vercel Env Vars.");
            }

            credential = _admin.credential.cert({
                projectId: project,
                clientEmail: email,
                privateKey: pk,
            });
        }

        if (credential) {
            _admin.initializeApp({ credential });
            _db = _admin.firestore();
        } else {
            console.warn("Firebase: No credentials found. App will run in limited mode.");
        }
    } catch (err) {
        console.error("FIREBASE_INIT_CRASH:", err.message);
        // Do not rethrow, let the app start so we can see the ping
    }

    return { db: _db, admin: _admin };
}

module.exports = {
    get db() { return getFirebase().db; },
    get admin() { return getFirebase().admin; }
};
