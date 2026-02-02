const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/authMiddleware');
const { db } = require('../config/firebase');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`Login attempt for: ${username}`);

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password required' });
        }

        const userSnapshot = await db.collection("users").where("username", "==", username).get();

        if (userSnapshot.empty) {
            console.warn(`Login failed: User '${username}' not found in Firestore.`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const userDoc = userSnapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() };

        console.log(`Found user: ${user.username}, comparing passwords...`);

        const passMatch = bcrypt.compareSync(password, user.password);

        if (!passMatch) {
            console.warn(`Login failed: Password mismatch for user '${username}'.`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`Login successful for: ${username}`);
        res.json({
            token: generateToken(user),
            user: { id: user.id, role: user.role, name: user.name }
        });
    } catch (error) {
        console.error('Login Exception:', error);
        const isDbError = error.message.includes('Firestore is not initialized');
        res.status(500).json({
            error: isDbError ? 'Database Connection Failed' : 'Internal Server Error',
            details: error.message
        });
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
