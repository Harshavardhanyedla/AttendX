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

        // Option A: Look for the JSON file (Local Seeding Only)
        const localKeyPath = '/Users/yadlaharshavardhan/Downloads/attendx-e5fbd-firebase-adminsdk-fbsvc-9e6b2d8648.json';

        if (fs.existsSync(localKeyPath)) {
            console.log("Firebase: Using local JSON key.");
            credential = admin.credential.cert(localKeyPath);
        } else if (process.env.FIREBASE_PRIVATE_KEY) {
            console.log("Firebase: Using Environment Variables.");

            // Clean up the project ID and email
            const projectId = (process.env.FIREBASE_PROJECT_ID || '').trim().replace(/^["']|["']$/g, '');
            const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim().replace(/^["']|["']$/g, '');

            // Critical: Clean up the private key
            let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();
            // Remove surrounding quotes if they exist
            privateKey = privateKey.replace(/^["']|["']$/g, '');
            // Convert literal \n to actual newlines
            privateKey = privateKey.replace(/\\n/g, '\n');

            credential = admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            });
        }

        if (credential) {
            admin.initializeApp({ credential });
            console.log("Firebase Admin SDK initialized successfully.");
            return admin.firestore();
        } else {
            console.error("CRITICAL ERROR: No Firebase credentials found (Vercel Env Vars or Local JSON).");
            // Instead of crashing, we return a mock/proxy or initialize empty to see logs
            return null;
        }
    } catch (error) {
        console.error("Firebase Admin SDK Initialization Error:", error.stack);
        return null;
    }
}

// Lazy load db to prevent crash during module import
const getDb = () => {
    if (!db) db = initializeFirebase();
    if (!db) throw new Error("Database not initialized. Check server logs for Firebase errors.");
    return db;
};

module.exports = {
    get db() { return getDb(); },
    admin
};
