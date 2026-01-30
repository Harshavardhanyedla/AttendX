import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();

    return (
        <nav style={{
            background: '#2563eb',
            padding: '1rem',
            marginBottom: '2rem',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>ClassTrack</div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
                <Link to="/cr" style={{
                    color: 'white',
                    textDecoration: location.pathname === '/cr' ? 'underline' : 'none',
                    fontWeight: location.pathname === '/cr' ? 'bold' : 'normal'
                }}>
                    📝 Take Attendance
                </Link>
                <Link to="/admin" style={{
                    color: 'white',
                    textDecoration: location.pathname === '/admin' || location.pathname === '/' ? 'underline' : 'none',
                    fontWeight: location.pathname === '/admin' || location.pathname === '/' ? 'bold' : 'normal'
                }}>
                    📊 Admin Dashboard
                </Link>
            </div>
        </nav>
    );
}
