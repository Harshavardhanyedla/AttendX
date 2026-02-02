const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Basic test route
app.get('/api/test', (req, res) => res.json({ message: 'Server is loading correctly' }));

// Routes - Commented out for debugging
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/attendance', require('./routes/attendance'));
// app.use('/api/reports', require('./routes/reports'));

// Export app for Vercel
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}
