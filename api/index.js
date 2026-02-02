const path = require('path');

module.exports = async (req, res) => {
    const send = (status, data) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
    };

    if (req.url === '/api/ping') {
        return send(200, { status: 'pong-final' });
    }

    try {
        const app = require('../backend/server');
        if (!app) throw new Error("App module is null/undefined");
        return app(req, res);
    } catch (error) {
        // Debugging Env Vars safely
        const envCheck = {
            hasProject: !!process.env.FIREBASE_PROJECT_ID,
            hasEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            hasKey: !!process.env.FIREBASE_PRIVATE_KEY,
            keyLen: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0
        };

        return send(500, {
            error: 'Backend Init Failed',
            message: error.message,
            stack: error.stack,
            envDebug: envCheck // <--- Sending back to client
        });
    }
};
