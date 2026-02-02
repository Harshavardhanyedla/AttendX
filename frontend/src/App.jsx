import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login'; // Kept generic import but won't use route
import CRDashboard from './pages/CRDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Simplified ProtectedRoute that allows everything
const ProtectedRoute = ({ children }) => {
    return children;
};

const NavigationWrapper = ({ children }) => {
    // Always show navbar
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
                        <Route path="/cr" element={<CRDashboard />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        {/* Default to Admin Dashboard */}
                        <Route path="/" element={<Navigate to="/admin" />} />
                        <Route path="/login" element={<Navigate to="/admin" />} />
                    </Routes>
                </NavigationWrapper>
            </BrowserRouter>
        </AuthProvider>
    );
}
