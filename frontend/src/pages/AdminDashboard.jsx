import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export default function AdminDashboard() {
    const { logout } = useAuth();
    const [liveData, setLiveData] = useState(null);

    // History View State
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewPeriod, setViewPeriod] = useState(1);
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Partial Attendance State
    const [bunkDate, setBunkDate] = useState(new Date().toISOString().split('T')[0]);
    const [bunkData, setBunkData] = useState(null);
    const [bunkLoading, setBunkLoading] = useState(false);

    const loadBunking = async () => {
        setBunkLoading(true);
        try {
            const res = await axios.get(`/api/attendance/partial?date=${bunkDate}`);
            setBunkData(res.data);
        } catch (err) {
            console.error(err);
            alert('Failed to load partial attendance data');
        } finally {
            setBunkLoading(false);
        }
    };

    // Report State
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const downloadReport = async () => {
        try {
            const res = await axios.get(`/api/reports/monthly?month=${reportMonth}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Attendance_Report_${reportMonth}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert('Failed to download report');
        }
    };

    useEffect(() => {
        loadLive();
    }, []);

    const loadLive = async () => {
        try {
            const res = await axios.get('/api/attendance/live');
            setLiveData(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await axios.get(`/api/attendance/students?date=${viewDate}&period=${viewPeriod}`);
            setHistoryData(res.data.students);
        } catch (err) {
            console.error(err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSync = async () => {
        if (!window.confirm('This will reset all attendance data and re-sync the timetable. Continue?')) return;
        try {
            await axios.post('/api/auth/seed');
            alert('Schedule synced successfully!');
            loadLive();
        } catch (err) {
            alert('Sync failed: ' + err.message);
        }
    };

    return (
        <div className="container">
            <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                <h1>Admin Dashboard</h1>
                <div className="flex gap-2">
                    <button onClick={handleSync} className="btn" style={{ background: '#f3f4f6' }}>🔄 Sync Schedule</button>
                    <button onClick={logout} className="btn btn-danger">Logout</button>
                </div>
            </div>

            <div className="card">
                <h2>Live Monitor ({liveData?.date})</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>Period</th>
                                <th style={{ padding: '0.75rem' }}>Subject</th>
                                <th style={{ padding: '0.75rem' }}>Status</th>
                                <th style={{ padding: '0.75rem' }}>Stats</th>
                            </tr>
                        </thead>
                        <tbody>
                            {liveData?.periods.map(p => (
                                <tr key={p.period} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '0.75rem' }}>P{p.period}</td>
                                    <td style={{ padding: '0.75rem' }}>{p.subject}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {p.isMarked ?
                                            <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', background: '#d1fae5', color: '#065f46', fontSize: '0.8rem' }}>MARKED</span>
                                            :
                                            <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', background: '#f3f4f6', color: '#6b7280', fontSize: '0.8rem' }}>PENDING</span>
                                        }
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {p.isMarked ? `${p.present} / ${p.total} Present` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button onClick={loadLive} className="btn" style={{ marginTop: '1rem', background: '#e5e7eb' }}>Refresh Live View</button>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Partial Attendance / Bunking Detector</h2>
                    <span style={{ fontSize: '0.8rem', background: '#ffe4e6', color: '#be123c', padding: '0.25rem 0.5rem', borderRadius: '1rem' }}>Admin Tool</span>
                </div>

                <div className="flex gap-4" style={{ marginBottom: '1rem', alignItems: 'flex-end', marginTop: '1rem' }}>
                    <div>
                        <label className="label">Select Date</label>
                        <input type="date" className="input" value={bunkDate} onChange={e => setBunkDate(e.target.value)} />
                    </div>
                    <button onClick={loadBunking} className="btn btn-primary" disabled={bunkLoading} style={{ background: '#be123c' }}>
                        {bunkLoading ? 'Analyzing...' : '🔍 Find Partial Attendees'}
                    </button>
                </div>

                {bunkData && (
                    <div style={{ marginTop: '1rem' }}>
                        <div style={{ padding: '1rem', background: '#fff1f2', border: '1px solid #fda4af', borderRadius: '0.5rem', marginBottom: '1rem', color: '#881337' }}>
                            <strong>Summary for {bunkDate}:</strong> Total Periods Conducted: <strong>{bunkData.totalPeriods}</strong>
                        </div>

                        {bunkData.students.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#fef2f2', textAlign: 'left', color: '#991b1b' }}>
                                            <th style={{ padding: '0.75rem' }}>Roll No</th>
                                            <th style={{ padding: '0.75rem' }}>Name</th>
                                            <th style={{ padding: '0.75rem' }}>Attended</th>
                                            <th style={{ padding: '0.75rem' }}>Missed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bunkData.students.map(s => (
                                            <tr key={s.id} style={{ borderBottom: '1px solid #fecaca' }}>
                                                <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{s.roll_no}</td>
                                                <td style={{ padding: '0.75rem' }}>{s.name}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#047857' }}>{s.attended}</span> / {s.total}
                                                </td>
                                                <td style={{ padding: '0.75rem', color: '#dc2626', fontWeight: 'bold' }}>
                                                    {s.missing} ⚠️
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#4b5563', background: '#f9fafb', borderRadius: '0.5rem' }}>
                                No partial attendance detected. Everyone either attended ALL classes or NONE.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Monthly Report</h2>
                    <span style={{ fontSize: '0.8rem', background: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.5rem', borderRadius: '1rem' }}>Export</span>
                </div>
                <div className="flex gap-4" style={{ marginBottom: '1rem', alignItems: 'flex-end', marginTop: '1rem' }}>
                    <div>
                        <label className="label">Select Month</label>
                        <input type="month" className="input" value={reportMonth} onChange={e => setReportMonth(e.target.value)} />
                    </div>
                    <button onClick={downloadReport} className="btn btn-primary">
                        📥 Download Monthly Report (CSV)
                    </button>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    Downloads a CSV file containing attendance percentage for all students for the selected month.
                </p>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h2>View Attendance History</h2>
                <div className="flex gap-4" style={{ marginBottom: '1rem', alignItems: 'flex-end' }}>
                    <div>
                        <label className="label">Date</label>
                        <input type="date" className="input" value={viewDate} onChange={e => setViewDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="label">Period</label>
                        <select className="input" value={viewPeriod} onChange={e => setViewPeriod(parseInt(e.target.value))}>
                            {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
                        </select>
                    </div>
                    <button onClick={loadHistory} className="btn btn-primary" style={{ marginBottom: '1rem' }}>View</button>
                </div>

                {historyData.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                        {historyData.map(s => (
                            <div key={s.id} style={{
                                padding: '0.75rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.375rem',
                                background: s.status === 'absent' ? '#fef2f2' : (s.status === 'present' ? '#ecfdf5' : 'white'),
                                opacity: s.status ? 1 : 0.6
                            }}>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{s.roll_no}</div>
                                <div style={{ fontWeight: '500' }}>{s.name}</div>
                                <div style={{
                                    fontSize: '0.8rem', fontWeight: 'bold', marginTop: '0.25rem',
                                    color: s.status === 'absent' ? 'red' : (s.status === 'present' ? 'green' : 'gray')
                                }}>
                                    {s.status ? s.status.toUpperCase() : 'NOT MARKED'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
