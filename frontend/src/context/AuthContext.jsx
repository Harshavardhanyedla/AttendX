import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Configure axios default header
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    // Verify token with backend
                    /* 
                       For now, since we might not have a /verify endpoint that returns user data 
                       exactly as we need without a full DB setup on every request, 
                       we will rely on localStorage user data if the token exists, 
                       BUT we should ideally verify it. 
                       Let's try to get current user.
                    */
                    // const res = await axios.get('/api/auth/me'); 
                    // setUser(res.data);

                    // Fallback to stored user if /me is not ready or to save latency for now,
                    // but strongly prefer server validation if possible.
                    // Given the previous code had /api/auth/me, let's try to use it.

                    const res = await axios.get('/api/auth/me');
                    setUser(res.data.user);

                } catch (err) {
                    console.error("Auth check failed:", err);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    delete axios.defaults.headers.common['Authorization'];
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const res = await axios.post('/api/auth/login', { username, password });
            const { token, user } = res.data; // Expecting { token, user: {...} }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            return { success: true };
        } catch (err) {
            console.error("Login failed:", err);
            return {
                success: false,
                error: err.response?.data?.message || 'Login failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user, isAdmin: user?.role === 'admin' }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
