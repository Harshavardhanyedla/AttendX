require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Try multiple ways to initialize: 
// 1. Env vars (for Vercel)
// 2. Local JSON file (for seeding)

if (!admin.apps.length) {
    try {
        let credential;

        // Option A: Look for the JSON file we just downloaded (easiest for seeding)
        const localKeyPath = '/Users/yadlaharshavardhan/Downloads/attendx-e5fbd-firebase-adminsdk-fbsvc-9e6b2d8648.json';

        if (fs.existsSync(localKeyPath)) {
            console.log("Using local JSON key for initialization...");
            credential = admin.credential.cert(localKeyPath);
        } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            console.log("Using environment variables for initialization...");
            const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
            credential = admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            });
        }

        if (credential) {
            admin.initializeApp({ credential });
            console.log("Firebase Admin SDK initialized successfully.");
        } else {
            console.warn("No Firebase credentials found. Database operations will fail.");
            admin.initializeApp(); // Fallback
        }
    } catch (error) {
        console.error("Firebase Admin SDK initialization error:", error.message);
    }
}

const db = admin.firestore();

module.exports = { db, admin };
