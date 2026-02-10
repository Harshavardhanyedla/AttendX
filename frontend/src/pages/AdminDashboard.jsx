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

    return (
        <div className="container">
            <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                <h1>Admin Dashboard</h1>
                <div className="flex gap-2">
                    <button onClick={logout} className="btn btn-danger">Logout</button>
                </div>
            </div>

            <div className="card">
                <h2>Live Monitor ({liveData?.date})</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Subject</th>
                                <th>Status</th>
                                <th>Stats</th>
                            </tr>
                        </thead>
                        <tbody>
                            {liveData?.periods.map(p => (
                                <tr key={p.period}>
                                    <td>P{p.period}</td>
                                    <td>{p.subject}</td>
                                    <td>
                                        {p.isMarked ?
                                            <span className="badge badge-success">MARKED</span>
                                            :
                                            <span className="badge badge-neutral">PENDING</span>
                                        }
                                    </td>
                                    <td>
                                        {p.isMarked ? `${p.present} / ${p.total} Present` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button onClick={loadLive} className="btn btn-outline" style={{ marginTop: '1.5rem' }}>Refresh Live View</button>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>Partial Attendance / Bunking Detector</h2>
                    <span className="badge badge-danger">Admin Tool</span>
                </div>

                <div className="flex gap-4" style={{ marginBottom: '1.5rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label className="label">Select Date</label>
                        <input type="date" className="input" value={bunkDate} onChange={e => setBunkDate(e.target.value)} />
                    </div>
                    <button onClick={loadBunking} className="btn btn-primary" disabled={bunkLoading} style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>
                        {bunkLoading ? 'Analyzing...' : '🔍 Find Partial Attendees'}
                    </button>
                </div>

                {bunkData && (
                    <div style={{ marginTop: '1rem' }}>
                        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
                            <strong>Summary for {bunkDate}:</strong>&nbsp; Total Periods Conducted: <strong>{bunkData.totalPeriods}</strong>
                        </div>

                        {bunkData.students.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Roll No</th>
                                            <th>Name</th>
                                            <th>Attended</th>
                                            <th>Missed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bunkData.students.map(s => (
                                            <tr key={s.id}>
                                                <td style={{ fontWeight: 'bold' }}>{s.roll_no}</td>
                                                <td>{s.name}</td>
                                                <td>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{s.attended}</span> / {s.total}
                                                </td>
                                                <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                                                    {s.missing} ⚠️
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="alert alert-success">
                                No partial attendance detected. Everyone either attended ALL classes or NONE.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Monthly Report</h2>
                    <span className="badge badge-neutral">Export</span>
                </div>
                <div className="flex gap-4" style={{ marginBottom: '1rem', alignItems: 'flex-end', marginTop: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label className="label">Select Month</label>
                        <input type="month" className="input" value={reportMonth} onChange={e => setReportMonth(e.target.value)} />
                    </div>
                    <button onClick={downloadReport} className="btn btn-primary">
                        📥 Download Monthly Report (CSV)
                    </button>
                </div>
                <p className="text-muted text-sm">
                    Downloads a CSV file containing attendance percentage for all students for the selected month.
                </p>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h2>View Attendance History</h2>
                <div className="flex gap-4" style={{ marginBottom: '1.5rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label className="label">Date</label>
                        <input type="date" className="input" value={viewDate} onChange={e => setViewDate(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="label">Period</label>
                        <select className="input" value={viewPeriod} onChange={e => setViewPeriod(parseInt(e.target.value))}>
                            {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
                        </select>
                    </div>
                    <button onClick={loadHistory} className="btn btn-primary">View</button>
                </div>

                {historyData.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                        {historyData.map(s => (
                            <div key={s.id} style={{
                                padding: '1rem',
                                border: '1px solid',
                                borderColor: s.status === 'absent' ? 'var(--danger)' : (s.status === 'present' ? 'var(--success)' : 'var(--border-color)'),
                                borderRadius: 'var(--radius-sm)',
                                background: s.status === 'absent' ? 'var(--danger-soft)' : (s.status === 'present' ? 'var(--success-soft)' : 'var(--card-bg)'),
                                opacity: s.status ? 1 : 0.6
                            }}>
                                <div className="text-muted text-sm" style={{ marginBottom: '0.25rem' }}>{s.roll_no}</div>
                                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{s.name}</div>
                                <div className={`badge ${s.status === 'absent' ? 'badge-danger' : (s.status === 'present' ? 'badge-success' : 'badge-neutral')}`}>
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
