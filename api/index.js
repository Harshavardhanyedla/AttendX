const app = require('../backend/server');

module.exports = async (req, res) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    try {
        // Ensure app is loaded
        if (!app) {
            throw new Error("Express app failed to load.");
        }
        return app(req, res);
    } catch (error) {
        console.error('VERCEL_CRASH:', error);
        res.status(500).json({
            error: 'Backend Crash',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
