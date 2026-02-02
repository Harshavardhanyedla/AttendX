require('dotenv').config();
const fs = require('fs');

let _db;
let _admin;

function getFirebase() {
    if (_admin) return { db: _db, admin: _admin };

    try {
        _admin = require('firebase-admin');
        let credential;

        const localKeyPath = '/Users/yadlaharshavardhan/Downloads/attendx-e5fbd-firebase-adminsdk-fbsvc-9e6b2d8648.json';

        if (fs.existsSync(localKeyPath)) {
            console.log("Firebase: Local JSON found.");
            credential = _admin.credential.cert(localKeyPath);
        } else if (process.env.FIREBASE_PRIVATE_KEY) {
            console.log("Firebase: Using Env Vars.");

            let pk = process.env.FIREBASE_PRIVATE_KEY.trim().replace(/^["']|["']$/g, '');
            // Support both literal \n and actual newlines
            pk = pk.split('\\n').join('\n');

            const email = (process.env.FIREBASE_CLIENT_EMAIL || '').trim().replace(/^["']|["']$/g, '');
            const project = (process.env.FIREBASE_PROJECT_ID || '').trim().replace(/^["']|["']$/g, '');

            credential = _admin.credential.cert({
                projectId: project,
                clientEmail: email,
                privateKey: pk,
            });
        }

        if (credential) {
            _admin.initializeApp({ credential });
            _db = _admin.firestore();
            console.log("Firebase: Success.");
        } else {
            console.error("Firebase: No credentials.");
        }
    } catch (err) {
        console.error("Firebase Init Crash:", err.message);
    }
    return { db: _db, admin: _admin };
}

module.exports = {
    get db() { return getFirebase().db; },
    get admin() { return getFirebase().admin; }
};
