const app = require('../backend/server');

module.exports = async (req, res) => {
    // 1. PING Check
    if (req.url === '/api/ping') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'pong', time: new Date().toISOString() }));
        return;
    }

    // 2. DEBUG Check - Test dependencies one by one
    if (req.url === '/api/debug') {
        const steps = [];
        try {
            steps.push("Starting Debug");

            steps.push("Loading bcryptjs...");
            const bcrypt = require('bcryptjs');
            steps.push("bcryptjs loaded");

            steps.push("Loading jsonwebtoken...");
            const jwt = require('jsonwebtoken');
            steps.push("jsonwebtoken loaded");

            steps.push("Loading firebase-admin...");
            const admin = require('firebase-admin');
            steps.push("firebase-admin loaded");

            steps.push("Loading local firebase config...");
            const { db } = require('../backend/config/firebase');
            steps.push("firebase config loaded");

            steps.push("Checking Firestore connection...");
            if (db) {
                steps.push("Firestore object exists");
                // Don't actually query to avoid timeout, just check object
            } else {
                steps.push("Firestore object is NULL");
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'success', steps }));
            return;
        } catch (error) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                status: 'failed',
                steps,
                error: error.message,
                stack: error.stack
            }));
            return;
        }
    }

    // 3. Normal App Request
    try {
        return app(req, res);
    } catch (error) {
        console.error('VERCEL_CRASH:', error);
        res.status(500).json({
            error: 'Backend Crash',
            message: error.message
        });
    }
};
