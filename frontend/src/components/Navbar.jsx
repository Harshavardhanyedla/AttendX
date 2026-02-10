import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="navbar-brand">ClassTrack</div>
            <div className="flex gap-4">
                <Link to="/cr" className={`nav-link ${location.pathname === '/cr' ? 'active' : ''}`}>
                    📝 Take Attendance
                </Link>
                <Link to="/admin" className={`nav-link ${location.pathname === '/admin' || location.pathname === '/' ? 'active' : ''}`}>
                    📊 Admin Dashboard
                </Link>
            </div>
        </nav>
    );
}
