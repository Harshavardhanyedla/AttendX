import { useState, useEffect } from 'react';
import { attendanceAPI, reportsAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

export default function Reports() {
    const [reportType, setReportType] = useState('period');
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        period: '1',
        studentId: '',
        subjectId: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [studentsRes, subjectsRes] = await Promise.all([
                attendanceAPI.getStudents(),
                attendanceAPI.getSubjects()
            ]);
            setStudents(studentsRes.data.students);
            setSubjects(subjectsRes.data.subjects);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const generateReport = async () => {
        setLoading(true);
        setReportData(null);

        try {
            let response;

            switch (reportType) {
                case 'period':
                    response = await reportsAPI.getPeriodReport(filters.date, filters.period);
                    break;
                case 'daily':
                    response = await reportsAPI.getDailyReport(filters.date);
                    break;
                case 'student':
                    if (!filters.studentId) {
                        setToast({ message: 'Please select a student', type: 'error' });
                        setLoading(false);
                        return;
                    }
                    response = await reportsAPI.getStudentReport(
                        filters.studentId,
                        filters.startDate,
                        filters.endDate
                    );
                    break;
                case 'subject':
                    if (!filters.subjectId) {
                        setToast({ message: 'Please select a subject', type: 'error' });
                        setLoading(false);
                        return;
                    }
                    response = await reportsAPI.getSubjectReport(
                        filters.subjectId,
                        filters.startDate,
                        filters.endDate
                    );
                    break;
                default:
                    break;
            }

            setReportData(response.data);
        } catch (error) {
            console.error('Error generating report:', error);
            setToast({ message: 'Failed to generate report', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = () => {
        let url;

        switch (reportType) {
            case 'period':
                url = reportsAPI.downloadPeriodPDF(filters.date, filters.period);
                break;
            case 'daily':
                url = reportsAPI.downloadDailyPDF(filters.date);
                break;
            case 'student':
                url = reportsAPI.downloadStudentPDF(
                    filters.studentId,
                    filters.startDate,
                    filters.endDate
                );
                break;
            default:
                return;
        }

        window.open(url, '_blank');
    };

    return (
        <div className="app-container">
            <Navbar />
            <main className="main-content">
                <h1 style={{ marginBottom: '1.5rem', fontSize: '1.75rem', fontWeight: '700' }}>
                    Reports
                </h1>

                {/* Report Type Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${reportType === 'period' ? 'active' : ''}`}
                        onClick={() => setReportType('period')}
                    >
                        📊 Period-wise
                    </button>
                    <button
                        className={`tab ${reportType === 'daily' ? 'active' : ''}`}
                        onClick={() => setReportType('daily')}
                    >
                        📅 Daily
                    </button>
                    <button
                        className={`tab ${reportType === 'student' ? 'active' : ''}`}
                        onClick={() => setReportType('student')}
                    >
                        👤 Student-wise
                    </button>
                    <button
                        className={`tab ${reportType === 'subject' ? 'active' : ''}`}
                        onClick={() => setReportType('subject')}
                    >
                        📚 Subject-wise
                    </button>
                </div>

                {/* Filters */}
                <div className="filters-bar">
                    {(reportType === 'period' || reportType === 'daily') && (
                        <div className="filter-group">
                            <label className="filter-label">Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={filters.date}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            />
                        </div>
                    )}

                    {reportType === 'period' && (
                        <div className="filter-group">
                            <label className="filter-label">Period</label>
                            <select
                                className="form-select"
                                value={filters.period}
                                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                            >
                                {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                                    <option key={p} value={p}>Period {p}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {reportType === 'student' && (
                        <div className="filter-group">
                            <label className="filter-label">Student</label>
                            <select
                                className="form-select"
                                value={filters.studentId}
                                onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
                            >
                                <option value="">Select Student</option>
                                {students.map((s) => (
                                    <option key={s.id} value={s.id}>{s.roll_no} - {s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {reportType === 'subject' && (
                        <div className="filter-group">
                            <label className="filter-label">Subject</label>
                            <select
                                className="form-select"
                                value={filters.subjectId}
                                onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {(reportType === 'student' || reportType === 'subject') && (
                        <>
                            <div className="filter-group">
                                <label className="filter-label">Start Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                />
                            </div>
                            <div className="filter-group">
                                <label className="filter-label">End Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    <div className="filter-group" style={{ alignSelf: 'flex-end' }}>
                        <button
                            className="btn btn-primary"
                            onClick={generateReport}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading-spinner"></span> Generating...
                                </>
                            ) : (
                                'Generate Report'
                            )}
                        </button>
                    </div>
                </div>

                {/* Report Results */}
                {reportData && (
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">
                                {reportType === 'period' && `Period ${reportData.period} Report`}
                                {reportType === 'daily' && `Daily Report - ${reportData.date}`}
                                {reportType === 'student' && `Student Report - ${reportData.student?.name}`}
                                {reportType === 'subject' && `Subject Report - ${reportData.subject?.name}`}
                            </h2>
                            {(reportType === 'period' || reportType === 'daily' || reportType === 'student') && (
                                <button className="btn btn-secondary" onClick={downloadPDF}>
                                    📥 Download PDF
                                </button>
                            )}
                        </div>

                        <div className="card-body">
                            {/* Summary Stats */}
                            {(reportData.summary || reportData.stats || reportData.overallSummary) && (
                                <div className="stats-grid mb-3">
                                    {reportType === 'period' && (
                                        <>
                                            <div className="stat-card">
                                                <div className="stat-icon primary">📅</div>
                                                <div className="stat-value">{reportData.periodLabel}</div>
                                                <div className="stat-label">{reportData.timeRange}</div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-icon success">✓</div>
                                                <div className="stat-value">{reportData.summary?.present || 0}</div>
                                                <div className="stat-label">Present</div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-icon danger">✕</div>
                                                <div className="stat-value">{reportData.summary?.absent || 0}</div>
                                                <div className="stat-label">Absent</div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-icon warning">📊</div>
                                                <div className="stat-value">{reportData.summary?.rate || 0}%</div>
                                                <div className="stat-label">Attendance Rate</div>
                                            </div>
                                        </>
                                    )}

                                    {reportType === 'daily' && (
                                        <>
                                            <div className="stat-card">
                                                <div className="stat-icon primary">📅</div>
                                                <div className="stat-value">{reportData.day}</div>
                                                <div className="stat-label">{reportData.date}</div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-icon success">📋</div>
                                                <div className="stat-value">{reportData.periods?.length || 0}</div>
                                                <div className="stat-label">Periods Recorded</div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-icon warning">📊</div>
                                                <div className="stat-value">{reportData.overallSummary?.overallRate || 0}%</div>
                                                <div className="stat-label">Overall Rate</div>
                                            </div>
                                        </>
                                    )}

                                    {(reportType === 'student' || reportType === 'subject') && (
                                        <>
                                            <div className="stat-card">
                                                <div className="stat-icon primary">📋</div>
                                                <div className="stat-value">{reportData.stats?.total || 0}</div>
                                                <div className="stat-label">Total Classes</div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-icon success">✓</div>
                                                <div className="stat-value">{reportData.stats?.present || 0}</div>
                                                <div className="stat-label">Present</div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-icon danger">✕</div>
                                                <div className="stat-value">{reportData.stats?.absent || 0}</div>
                                                <div className="stat-label">Absent</div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-icon warning">📊</div>
                                                <div className="stat-value">{reportData.stats?.rate || 0}%</div>
                                                <div className="stat-label">Attendance Rate</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Period-wise Report Table */}
                            {reportType === 'period' && reportData.attendance && (
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Roll No</th>
                                                <th>Name</th>
                                                <th>Gender</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.attendance.map((record) => (
                                                <tr key={record.id}>
                                                    <td>{record.roll_no}</td>
                                                    <td>{record.name}</td>
                                                    <td>{record.gender}</td>
                                                    <td>
                                                        <span className={`badge badge-${record.status}`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Daily Report Table */}
                            {reportType === 'daily' && reportData.periods && (
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Period</th>
                                                <th>Time</th>
                                                <th>Subject</th>
                                                <th>Present</th>
                                                <th>Absent</th>
                                                <th>Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.periods.map((period) => (
                                                <tr key={period.period}>
                                                    <td><strong>{period.periodLabel}</strong></td>
                                                    <td>{period.timeRange}</td>
                                                    <td>{period.subject}</td>
                                                    <td className="text-success">{period.present}</td>
                                                    <td className="text-danger">{period.absent}</td>
                                                    <td>
                                                        <span className={`badge ${period.rate >= 75 ? 'badge-present' : 'badge-absent'}`}>
                                                            {period.rate}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Student/Subject Breakdown */}
                            {(reportType === 'student' && reportData.subjectWise) && (
                                <>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
                                        Subject-wise Breakdown
                                    </h3>
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Subject</th>
                                                    <th>Present</th>
                                                    <th>Absent</th>
                                                    <th>Total</th>
                                                    <th>Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.subjectWise.map((sub, i) => (
                                                    <tr key={i}>
                                                        <td>{sub.subject}</td>
                                                        <td className="text-success">{sub.present}</td>
                                                        <td className="text-danger">{sub.absent}</td>
                                                        <td>{sub.total}</td>
                                                        <td>
                                                            <span className={`badge ${sub.rate >= 75 ? 'badge-present' : 'badge-absent'}`}>
                                                                {sub.rate}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}

                            {(reportType === 'subject' && reportData.studentWise) && (
                                <>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
                                        Student-wise Breakdown
                                    </h3>
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Roll No</th>
                                                    <th>Name</th>
                                                    <th>Present</th>
                                                    <th>Absent</th>
                                                    <th>Total</th>
                                                    <th>Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.studentWise.map((stu) => (
                                                    <tr key={stu.student_id}>
                                                        <td>{stu.roll_no}</td>
                                                        <td>{stu.name}</td>
                                                        <td className="text-success">{stu.present}</td>
                                                        <td className="text-danger">{stu.absent}</td>
                                                        <td>{stu.total}</td>
                                                        <td>
                                                            <span className={`badge ${stu.rate >= 75 ? 'badge-present' : 'badge-absent'}`}>
                                                                {stu.rate}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {!reportData && !loading && (
                    <div className="card">
                        <div className="card-body">
                            <div className="empty-state">
                                <div className="empty-state-icon">📊</div>
                                <div className="empty-state-title">Generate a Report</div>
                                <div className="empty-state-text">
                                    Select the report type and filters, then click "Generate Report"
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
