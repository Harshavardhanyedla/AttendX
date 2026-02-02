require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');

if (!admin.apps.length) {
    try {
        let credential;

        // Option A: Look for the JSON file (Local Seeding)
        const localKeyPath = '/Users/yadlaharshavardhan/Downloads/attendx-e5fbd-firebase-adminsdk-fbsvc-9e6b2d8648.json';

        if (fs.existsSync(localKeyPath)) {
            console.log("Initialization: Using local JSON key.");
            credential = admin.credential.cert(localKeyPath);
        } else if (process.env.FIREBASE_PRIVATE_KEY) {
            console.log("Initialization: Using Environment Variables.");

            // Log lengths to help debug missing characters (masked)
            console.log(`Key length: ${process.env.FIREBASE_PRIVATE_KEY.length}`);

            let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();
            // Handle quotes if they were pasted accidentally
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.substring(1, privateKey.length - 1);
            }
            // Replace literal \n with actual newlines
            privateKey = privateKey.replace(/\\n/g, '\n');

            const projectId = (process.env.FIREBASE_PROJECT_ID || '').replace(/"/g, '').trim();
            const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').replace(/"/g, '').trim();

            credential = admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            });
        }

        if (credential) {
            admin.initializeApp({ credential });
            console.log("Firebase Admin SDK initialized successfully.");
        } else {
            console.error("FATAL: No Firebase credentials found in env or local file.");
        }
    } catch (error) {
        console.error("Firebase Admin SDK Initialization Error:", error.message);
    }
}

const db = admin.firestore();

module.exports = { db, admin };
