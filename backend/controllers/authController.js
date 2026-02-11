const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/authMiddleware');
const { supabase } = require('../config/supabase');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`Supabase Login attempt for: ${username}`);

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password required' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !user) {
            console.warn(`Login failed: User '${username}' not found in Supabase.`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`Found user: ${user.username}, comparing passwords...`);

        const passMatch = bcrypt.compareSync(password, user.password || '');

        if (!passMatch) {
            console.warn(`Login failed: Password mismatch for user '${username}'.`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`Login successful for: ${username}`);
        res.json({
            token: generateToken({ id: user.id || user.username, role: user.role }),
            user: { id: user.id || user.username, role: user.role, name: user.name }
        });
    } catch (error) {
        console.error('Supabase Login Exception:', error);
        res.status(500).json({
            error: 'Database Connection Failed',
            details: error.message
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, role, name')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
