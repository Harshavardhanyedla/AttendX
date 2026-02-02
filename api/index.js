const app = require('../backend/server');

module.exports = async (req, res) => {
    // 1. PING Check
    if (req.url === '/api/ping') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'pong', time: new Date().toISOString() }));
        return;
    }

    // 2. DEBUG Env - Check if variables exist (SAFE)
    if (req.url === '/api/debug-env') {
        try {
            const pk = process.env.FIREBASE_PRIVATE_KEY || '';
            const email = process.env.FIREBASE_CLIENT_EMAIL || '';
            const project = process.env.FIREBASE_PROJECT_ID || '';

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                status: 'success',
                env: {
                    project: project,
                    email: email,
                    privateKeyLength: pk.length,
                    privateKeyStart: pk.substring(0, 10),
                    privateKeyHasNewline: pk.includes('\n'),
                    privateKeyHasEscapedNewline: pk.includes('\\n'),
                    privateKeyHasBegin: pk.includes('BEGIN PRIVATE KEY')
                }
            }));
            return;
        } catch (error) {
            res.end(JSON.stringify({ error: error.message }));
            return;
        }
    }

    // 3. Normal App Request
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
