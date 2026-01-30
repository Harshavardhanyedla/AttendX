const jwt = require('jsonwebtoken');
const SECRET = 'dev-secret';

exports.generateToken = (u) => jwt.sign({ id: u.id, role: u.role }, SECRET);
exports.verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        // Temporary bypass: default to admin
        req.user = { id: 1, role: 'admin', name: 'Guest Admin' };
        return next();
    }
    jwt.verify(token, SECRET, (err, dec) => {
        if (err) {
            // Even if token invalid, allow bypass for now
            req.user = { id: 1, role: 'admin', name: 'Guest Admin' };
            return next();
        }
        req.user = dec; next();
    });
};
exports.isAdmin = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin only' });
exports.isCROrAdmin = (req, res, next) => ['admin', 'cr'].includes(req.user.role) ? next() : res.status(403).json({ error: 'Access denied' });
