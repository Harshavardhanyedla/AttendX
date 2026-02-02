module.exports = async (req, res) => {
    // 1. PING Check
    if (req.url === '/api/ping') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'pong', time: new Date().toISOString() }));
        return;
    }

    // 2. DEBUG Check
    if (req.url === '/api/debug') {
        const steps = [];
        try {
            steps.push("Starting Debug");

            steps.push("Loading bcryptjs...");
            require('bcryptjs');
            steps.push("bcryptjs OK");

            steps.push("Loading firebase-admin...");
            require('firebase-admin');
            steps.push("firebase-admin OK");

            steps.push("Loading pdfkit...");
            require('pdfkit'); // Checking if this crashes
            steps.push("pdfkit OK");

            steps.push("Loading server.js...");
            require('../backend/server');
            steps.push("server.js OK");

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

    if (req.url === '/api/debug-env') {
        try {
            const pk = process.env.FIREBASE_PRIVATE_KEY || '';
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                status: 'success',
                env: {
                    project: process.env.FIREBASE_PROJECT_ID,
                    email: process.env.FIREBASE_CLIENT_EMAIL,
                    pkLen: pk.length,
                    pkStart: pk.substring(0, 10),
                }
            }));
            return;
        } catch (e) {
            res.end(JSON.stringify({ error: e.message }));
            return;
        }
    }

    // 3. Normal App Request
    try {
        const app = require('../backend/server');
        if (!app) throw new Error("App failed to load");
        return app(req, res);
    } catch (error) {
        console.error('VERCEL_CRASH:', error);
        res.status(500).json({
            error: 'Backend Crash',
            message: error.message,
            stack: error.stack
        });
    }
};
