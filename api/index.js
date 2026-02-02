const path = require('path');

module.exports = async (req, res) => {
    // Helper for native response
    const send = (status, data) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
    };

    if (req.url === '/api/ping') {
        return send(200, { status: 'pong-native' });
    }

    try {
        console.log("Loading server from:", path.resolve(__dirname, '../backend/server.js'));
        const app = require('../backend/server');
        if (!app) throw new Error("App module is null/undefined");

        // Pass to Express app
        return app(req, res);
    } catch (error) {
        console.error('CRASH:', error);
        return send(500, {
            error: 'Backend Init Failed',
            code: error.code,
            message: error.message,
            stack: error.stack,
            cwd: process.cwd()
        });
    }
};
