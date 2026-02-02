const app = require('../backend/server');

module.exports = async (req, res) => {
    try {
        app(req, res);
    } catch (error) {
        console.error('Vercel Function Error:', error);
        res.status(500).json({
            error: 'Server Crash',
            message: error.message,
            stack: error.stack
        });
    }
};
