const fs = require('fs');

let _admin;
let _db;

function getFirebase() {
    if (_admin && _db) return { db: _db, admin: _admin };

    try {
        _admin = require('firebase-admin');

        let credential;
        const localKeyPath = '/Users/yadlaharshavardhan/Downloads/attendx-e5fbd-firebase-adminsdk-fbsvc-9e6b2d8648.json';

        if (fs.existsSync(localKeyPath)) {
            console.log("Firebase: Using local JSON.");
            credential = _admin.credential.cert(localKeyPath);
        } else {
            // Priority 1: FIREBASE_PRIVATE_KEY
            let pk = process.env.FIREBASE_PRIVATE_KEY;
            let email = process.env.FIREBASE_CLIENT_EMAIL;
            let project = process.env.FIREBASE_PROJECT_ID;

            if (pk && email && project) {
                console.log("Firebase: Initializing from Env Vars.");

                // Clean input
                const clean = (val) => (val || '').trim().replace(/^["']|["']$/g, '');
                pk = clean(pk);
                email = clean(email);
                project = clean(project);

                // Handle double-escaped newlines or literal newlines
                pk = pk.replace(/\\n/g, '\n');

                if (!pk.includes('-----BEGIN PRIVATE KEY-----')) {
                    console.error("Firebase Auth Error: Private Key is missing the BEGIN header.");
                } else {
                    credential = _admin.credential.cert({
                        projectId: project,
                        clientEmail: email,
                        privateKey: pk,
                    });
                }
            } else {
                console.error("Firebase Auth Error: Missing Env Vars. Found:", {
                    project: !!project,
                    email: !!email,
                    pk: !!pk
                });
            }
        }

        if (credential) {
            if (!_admin.apps.length) {
                _admin.initializeApp({ credential });
            }
            _db = _admin.firestore();
            console.log("Firebase: Success.");
        }
    } catch (err) {
        console.error("Firebase Critical Init Failure:", err.message);
    }

    return { db: _db, admin: _admin };
}

module.exports = {
    get db() {
        const { db } = getFirebase();
        if (!db) throw new Error("Firestore is not initialized. Check server logs for FIREBASE_INIT_CRASH.");
        return db;
    },
    get admin() {
        const { admin } = getFirebase();
        return admin;
    }
};
