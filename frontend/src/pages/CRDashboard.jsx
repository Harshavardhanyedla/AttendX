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
            const res = err.response?.data || {};
            const errorText = res.message || res.details || res.firebaseError || res.error || err.message || 'Error loading data';
            setMsg('Debug Error: ' + errorText);
            if (res.envDebug) {
                console.log("Env Debug Info:", res.envDebug);
            }
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
                <div className="flex gap-4" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label className="label">Day</label>
                        <div className="input" style={{ background: 'var(--bg-color)', color: 'var(--text-muted)' }}>
                            {day} ({new Date().toLocaleDateString()})
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label className="label">Select Period</label>
                        <select className="input" value={period} onChange={e => setPeriod(parseInt(e.target.value))}>
                            {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
                        </select>
                    </div>
                </div>

                {session?.message && <div className="alert alert-danger">{session.message}</div>}
                {msg && <div className="alert alert-info">{msg}</div>}

                {session?.subject && (
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <h2 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>{session.subject.name}</h2>
                        <div className="text-muted text-sm">{getDateForDay(day)}</div>
                    </div>
                )}

                {session?.isMarked && (
                    <div className="alert alert-info">
                        Attendance for this period has already been submitted and cannot be edited.
                    </div>
                )}

                {loading && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        <span className="loading-spinner" style={{ borderTopColor: 'var(--primary)', borderRightColor: 'var(--primary)' }}></span>
                        Loading data...
                    </div>
                )}

                {!loading && !session?.subject && !session?.message && (
                    <div className="alert alert-warning">
                        No subject assigned for {day} Period {period}. You can only take attendance for periods with assigned subjects.
                    </div>
                )}
            </div>

            {session?.subject && !loading && (
                <div className="card animate-fade-in">
                    <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                        <h2>Student List ({students.length})</h2>
                        <div className="flex gap-2">
                            <span className="badge badge-success">P: {Object.values(attendance).filter(s => s === 'present').length}</span>
                            <span className="badge badge-danger">A: {Object.values(attendance).filter(s => s === 'absent').length}</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {students.map(s => (
                            <div key={s.id}
                                style={{
                                    padding: '1rem',
                                    border: '1px solid',
                                    borderColor: attendance[s.id] === 'present' ? 'var(--success)' : attendance[s.id] === 'absent' ? 'var(--danger)' : 'var(--border-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    background: attendance[s.id] === 'present' ? 'var(--success-soft)' : attendance[s.id] === 'absent' ? 'var(--danger-soft)' : 'var(--card-bg)',
                                    transition: 'all 0.2s',
                                    opacity: session?.isMarked ? 0.7 : 1
                                }}
                            >
                                <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>{s.roll_no}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', minHeight: '2.5rem', marginBottom: '0.5rem' }}>{s.name}</div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setStatus(s.id, 'present')}
                                        disabled={session?.isMarked}
                                        className={`btn btn-sm ${attendance[s.id] === 'present' ? 'btn-success' : 'btn-outline-success'}`}
                                        style={{ flex: 1 }}
                                    >
                                        PRESENT
                                    </button>
                                    <button
                                        onClick={() => setStatus(s.id, 'absent')}
                                        disabled={session?.isMarked}
                                        className={`btn btn-sm ${attendance[s.id] === 'absent' ? 'btn-danger' : 'btn-outline-danger'}`}
                                        style={{ flex: 1 }}
                                    >
                                        ABSENT
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!session?.isMarked && (
                        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                            <button onClick={submit} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                                SAVE ATTENDANCE
                            </button>
                            {msg && <div style={{ textAlign: 'center', marginTop: '1rem', fontWeight: 'bold' }}>{msg}</div>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
