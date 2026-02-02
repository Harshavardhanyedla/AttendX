module.exports = async (req, res) => {
    if (req.url === '/api/ping') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'pong', time: new Date().toISOString() }));
        return;
    }

    try {
        const app = require('../backend/server');
        if (!app) throw new Error("App failed to load");
        return app(req, res);
    } catch (error) {
        console.error('VERCEL_GLOBAL_CRASH:', error);
        res.status(500).json({
            error: 'Server Initialization Failed',
            message: error.message,
            stack: error.stack
        });
    }
};
