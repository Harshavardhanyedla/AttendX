import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Force logged in state
    const [user, setUser] = useState({
        id: 'mock_admin_id',
        role: 'admin',
        name: 'Dev Admin'
    });
    const [loading, setLoading] = useState(false);

    // Disable auth check for now
    /*
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const res = await axios.get('/api/auth/me');
                    setUser(res.data);
                } catch (err) {
                    localStorage.removeItem('token');
                    delete axios.defaults.headers.common['Authorization'];
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);
    */

    const login = async (username, password) => {
        // Mock login
        const mockUser = { id: 'mock_admin_id', role: 'admin', name: 'Dev Admin' };
        setUser(mockUser);
        return mockUser;
    };

    const logout = () => {
        // Do nothing or maybe reset but for now we want perma-login
        console.log("Logout disabled in dev mode");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: true }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
