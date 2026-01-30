const bcrypt = require('bcryptjs');
const { getDb } = require('../config/database');
const { generateToken } = require('../middleware/authMiddleware');

exports.login = (req, res) => {
    const { username, password } = req.body;
    const user = getDb().prepare('SELECT * FROM users WHERE username=?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid' });
    res.json({ token: generateToken(user), user: { id: user.id, role: user.role, name: user.name } });
};

exports.getMe = (req, res) => {
    const user = getDb().prepare('SELECT id,username,name,role FROM users WHERE id=?').get(req.user.id);
    res.json({ user });
};
