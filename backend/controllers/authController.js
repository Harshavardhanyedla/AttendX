const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/authMiddleware');
const { db } = require('../config/firebase');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`Login attempt for username: ${username}`);

        const userSnapshot = await db.collection("users").where("username", "==", username).get();

        if (userSnapshot.empty) {
            console.warn(`Login failed: user not found in DB - ${username}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const userDoc = userSnapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() };

        const passMatch = bcrypt.compareSync(password, user.password);
        console.log(`User found: ${user.username}, Role: ${user.role}, Password Match: ${passMatch}`);

        if (!passMatch) {
            console.warn(`Login failed: password mismatch for ${username}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        res.json({ token: generateToken(user), user: { id: user.id, role: user.role, name: user.name } });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const userDoc = await db.collection("users").doc(req.user.id).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = { id: userDoc.id, ...userDoc.data() };
        delete user.password;
        res.json({ user });
    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
