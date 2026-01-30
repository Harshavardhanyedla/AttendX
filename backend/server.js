const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/attendance', require('./routes/attendance'));
// app.use('/api/reports', require('./routes/reports')); // later

// Export app for Vercel
module.exports = app;

if (require.main === module) {
    initializeDatabase().then(() => {
        app.listen(PORT, () => console.log(`Server running on ${PORT}`));
    });
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});
