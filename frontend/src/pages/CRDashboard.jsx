import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export default function CRDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [day, setDay] = useState(DAYS[new Date().getDay() - 1] || 'Monday');
    const [period, setPeriod] = useState(1);
    const [session, setSession] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    // Initial load to attempt auto-detection
    useEffect(() => {
        // Basic auto-detect logic or default to first
        loadSession();
    }, [day, period]);

    const loadSession = async () => {
        setLoading(true);
        setMsg('');
        try {
            const res = await axios.get(`/api/attendance/session?day=${day}&period=${period}`);
            setSession(res.data);

            if (res.data.subject) {
                // Load students with existing status
                // Pass date? For "Edit attendance for the same day", we need to know WHICH date.
                // Prompt says "Edit attendance for the same day and period".
                // If I select "Monday", WHICH Monday? "Latest saved attendance overwrites previous one".
                // Usually means "Today" or "The relevant date for that day this week".
                // To keep it simple: We assume "Today" if Day matches, or "Next/Last" matching date?
                // Simpler: Just use current date for "Today" and block others?
                // OR: Allow selecting specific Date?
                // Prompt says "Select Day (Monday–Saturday)". Not "Select Date".
                // This usually implies "The upcoming or current occurrence of this Day".

                // Let's implement: Calculate the Date based on the selected Day relative to today.
                // If today is Monday, selected Monday = Today.
                // If today is Tuesday, selected Monday = Yesterday? Or Next Week? 
                // For attendance "Edit", it's usually "Today's attendance" or "Recent".
                // Let's assume we operate on the *current week's* instance of that day, or just "Today" if it matches?

                // Let's default to: We interpret "Monday" as "The most recent Monday" or "Today".
                // Actually, simplest is to just send the 'date'. 
                // Let's calculate the date object.

                const targetDate = getDateForDay(day);

                const studRes = await axios.get(`/api/attendance/students?date=${targetDate}&period=${period}`);
                setStudents(studRes.data.students);

                // Initialize state: NULL instead of 'present' by default
                const initial = {};
                studRes.data.students.forEach(s => {
                    initial[s.id] = s.status || null;
                });
                setAttendance(initial);
            } else {
                setStudents([]);
            }
        } catch (err) {
            console.error(err);
            setMsg('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const getDateForDay = (dayName) => {
        const today = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayIndex = today.getDay();
        const targetIndex = days.indexOf(dayName);

        const diff = targetIndex - todayIndex;
        const date = new Date(today);
        date.setDate(today.getDate() + diff);
        return date.toISOString().split('T')[0];
    };

    const setStatus = (id, status) => {
        setAttendance(prev => ({
            ...prev,
            [id]: status
        }));
    };

    const submit = async () => {
        if (!session?.subject) return;

        // Check if all students are marked
        const unmarked = Object.values(attendance).filter(v => v === null).length;
        if (unmarked > 0) {
            if (!window.confirm(`${unmarked} students are not marked. Mark them as absent?`)) {
                return;
            }
            // Auto-mark unmarked as absent
            const updated = { ...attendance };
            Object.keys(updated).forEach(id => {
                if (updated[id] === null) updated[id] = 'absent';
            });
            setAttendance(updated);
            // Continue with submission
        }

        try {
            const records = Object.entries(attendance).map(([sid, status]) => ({
                studentId: parseInt(sid),
                status: status || 'absent' // Final safeguard
            }));

            const targetDate = getDateForDay(day);

            await axios.post('/api/attendance/mark', {
                date: targetDate,
                period,
                subject_id: session.subject.id,
                records
            });
            setMsg(`Attendance saved for ${session.subject.name}!`);
            // Reload to ensure sync
            loadSession();
        } catch (err) {
            setMsg('Failed to save');
        }
    };

    return (
        <div className="container">
            <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                <h1>CR Dashboard</h1>
                <button onClick={logout} className="btn btn-danger">Logout</button>
            </div>

            <div className="card">
                <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                    <div>
                        <label className="label">Select Day</label>
                        <select className="input" value={day} onChange={e => setDay(e.target.value)}>
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Select Period</label>
                        <select className="input" value={period} onChange={e => setPeriod(parseInt(e.target.value))}>
                            {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
                        </select>
                    </div>
                </div>

                {session?.message && <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', marginTop: '1rem' }}>{session.message}</div>}

                {session?.subject && (
                    <div style={{ marginTop: '1rem' }}>
                        <h2 className="text-xl font-bold text-indigo-600">Subject: {session.subject.name}</h2>
                        <div className="text-sm text-gray-500">{getDateForDay(day)}</div>
                    </div>
                )}

                {loading && <div style={{ textAlign: 'center', padding: '1rem' }}>Loading data...</div>}

                {!loading && !session?.subject && !session?.message && (
                    <div style={{ padding: '1rem', background: '#fef3c7', color: '#92400e', borderRadius: '0.5rem', marginTop: '1rem' }}>
                        No subject assigned for {day} Period {period}. You can only take attendance for periods with assigned subjects.
                    </div>
                )}
            </div>

            {session?.subject && !loading && (
                <div className="card">
                    <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                        <h2>Student List ({students.length})</h2>
                        <div className="flex gap-2">
                            <span style={{ color: 'green' }}>P: {Object.values(attendance).filter(s => s === 'present').length}</span>
                            <span style={{ color: 'red' }}>A: {Object.values(attendance).filter(s => s === 'absent').length}</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {students.map(s => (
                            <div key={s.id}
                                style={{
                                    padding: '1rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    background: attendance[s.id] === 'present' ? '#ecfdf5' : attendance[s.id] === 'absent' ? '#fef2f2' : '#ffffff',
                                    borderColor: attendance[s.id] === 'present' ? '#10b981' : attendance[s.id] === 'absent' ? '#ef4444' : '#e5e7eb',
                                    boxShadow: attendance[s.id] ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ fontWeight: 'bold' }}>{s.roll_no}</div>
                                <div style={{ fontSize: '0.9rem', color: '#374151', minHeight: '2.5rem' }}>{s.name}</div>

                                <div className="flex gap-2" style={{ marginTop: '0.5rem' }}>
                                    <button
                                        onClick={() => setStatus(s.id, 'present')}
                                        style={{
                                            flex: 1,
                                            padding: '0.4rem',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            background: attendance[s.id] === 'present' ? '#10b981' : '#f3f4f6',
                                            color: attendance[s.id] === 'present' ? 'white' : '#4b5563',
                                            border: '1px solid',
                                            borderColor: attendance[s.id] === 'present' ? '#059669' : '#d1d5db'
                                        }}
                                    >
                                        PRESENT
                                    </button>
                                    <button
                                        onClick={() => setStatus(s.id, 'absent')}
                                        style={{
                                            flex: 1,
                                            padding: '0.4rem',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            background: attendance[s.id] === 'absent' ? '#ef4444' : '#f3f4f6',
                                            color: attendance[s.id] === 'absent' ? 'white' : '#4b5563',
                                            border: '1px solid',
                                            borderColor: attendance[s.id] === 'absent' ? '#dc2626' : '#d1d5db'
                                        }}
                                    >
                                        ABSENT
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <button onClick={submit} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                            SAVE ATTENDANCE
                        </button>
                        {msg && <div style={{ textAlign: 'center', marginTop: '1rem', fontWeight: 'bold' }}>{msg}</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
