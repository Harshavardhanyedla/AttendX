import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import CRDashboard from './pages/CRDashboard';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
};

const RootRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return <Navigate to={user.role === 'admin' ? '/admin' : '/cr'} />;
};

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/cr" element={
                        <ProtectedRoute role="cr"><CRDashboard /></ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                        <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
                    } />
                    <Route path="/" element={<RootRedirect />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
