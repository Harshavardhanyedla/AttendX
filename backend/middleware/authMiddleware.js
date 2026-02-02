const jwt = require('jsonwebtoken');
const SECRET = 'dev-secret';

exports.generateToken = (u) => jwt.sign({ id: u.id, role: u.role }, SECRET);

// BYPASS AUTHENTICATION FOR DEVELOPMENT
exports.verifyToken = (req, res, next) => {
    // Mock an admin user
    req.user = {
        id: 'mock_admin_id',
        role: 'admin',
        name: 'Dev Admin'
    };
    next();
};

exports.isAdmin = (req, res, next) => next();
exports.isCROrAdmin = (req, res, next) => next();
