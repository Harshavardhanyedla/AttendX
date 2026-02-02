require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');

let db;

function initializeFirebase() {
    if (admin.apps.length > 0) {
        return admin.firestore();
    }

    try {
        let credential;

        // Option A: Local Seeding
        const localKeyPath = '/Users/yadlaharshavardhan/Downloads/attendx-e5fbd-firebase-adminsdk-fbsvc-9e6b2d8648.json';

        if (fs.existsSync(localKeyPath)) {
            console.log("Firebase: Using local JSON key.");
            credential = admin.credential.cert(localKeyPath);
        } else if (process.env.FIREBASE_PRIVATE_KEY) {
            console.log("Firebase: Attempting Env Var Initialization...");

            let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();
            // Remove any types of quotes
            privateKey = privateKey.replace(/^["']|["']$/g, '');

            // If the key doesn't have \n but has actual newlines, we need to handle both
            if (privateKey.includes('\\n')) {
                privateKey = privateKey.replace(/\\n/g, '\n');
            }

            const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim().replace(/^["']|["']$/g, '');
            const projectId = (process.env.FIREBASE_PROJECT_ID || '').trim().replace(/^["']|["']$/g, '');

            console.log(`Debug Info: PK Length=${privateKey.length}, Project=${projectId}, Email=${clientEmail}`);

            if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
                console.error("FATAL: Private Key is missing BEGIN header!");
            }

            credential = admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            });
        }

        if (credential) {
            admin.initializeApp({ credential });
            console.log("Firebase: Initialization Successful.");
            return admin.firestore();
        } else {
            console.error("FATAL: No credentials found to initialize Firebase.");
            return null;
        }
    } catch (error) {
        console.error("Firebase Initialization CRASH:", error.message);
        return null;
    }
}

const getDb = () => {
    if (!db) db = initializeFirebase();
    if (!db) {
        console.error("Attempted to access Firestore but it is not initialized.");
        return null;
    }
    return db;
};

module.exports = {
    get db() { return getDb(); },
    admin
};
