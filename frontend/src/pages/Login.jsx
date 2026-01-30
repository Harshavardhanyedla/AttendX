import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await login(username, password);
            navigate(user.role === 'admin' ? '/admin' : '/cr');
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 style={{ textAlign: 'center' }}>ClassTrack</h1>
                <form onSubmit={handleSubmit}>
                    {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Username</label>
                        <input className="input" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Password</label>
                        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
                </form>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
                    Examples: admin/admin123, cr/cr123
                </div>
            </div>
        </div>
    );
}
