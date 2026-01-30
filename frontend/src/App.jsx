import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import CRDashboard from './pages/CRDashboard';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

const NavigationWrapper = ({ children }) => {
    const { user } = useAuth();
    return (
        <>
            {user && <Navbar />}
            {children}
        </>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <NavigationWrapper>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/cr" element={<ProtectedRoute><CRDashboard /></ProtectedRoute>} />
                        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/" element={<Navigate to="/cr" />} />
                    </Routes>
                </NavigationWrapper>
            </BrowserRouter>
        </AuthProvider>
    );
}
