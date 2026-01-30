import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import CRDashboard from './pages/CRDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Navbar />
                <Routes>
                    <Route path="/cr" element={<CRDashboard />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/" element={<AdminDashboard />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
