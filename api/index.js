const app = require('../backend/server');
const { initializeDatabase } = require('../backend/config/database');

module.exports = async (req, res) => {
    try {
        await initializeDatabase();
        app(req, res);
    } catch (error) {
        console.error('DB Init Error:', error);
        res.status(500).json({ error: 'Database Initialization Failed' });
    }
};
