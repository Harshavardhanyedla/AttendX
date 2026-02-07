import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import CRDashboard from './pages/CRDashboard';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" />;
    return children;
};

const NavigationWrapper = ({ children }) => {
    const { isAuthenticated } = useAuth();
    // Only show navbar if authenticated
    if (!isAuthenticated) return children;

    return (
        <>
            <Navbar />
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
                        <Route path="/cr" element={
                            <ProtectedRoute>
                                <CRDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/admin" element={
                            <ProtectedRoute>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } />
                        {/* Default redirect */}
                        <Route path="/" element={<Navigate to="/login" />} />
                    </Routes>
                </NavigationWrapper>
            </BrowserRouter>
        </AuthProvider>
    );
}
