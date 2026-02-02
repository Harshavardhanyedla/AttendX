const path = require('path');

module.exports = async (req, res) => {
    // Helper
    const send = (status, data) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
    };

    if (req.url === '/api/ping') {
        return send(200, { status: 'pong' });
    }

    try {
        const app = require('../backend/server');
        if (!app) throw new Error("App module is null/undefined");
        return app(req, res);
    } catch (error) {
        console.error('CRASH:', error);
        return send(500, {
            error: 'Backend Init Failed',
            message: error.message
        });
    }
};
