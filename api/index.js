const app = require('../backend/server');

module.exports = async (req, res) => {
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
