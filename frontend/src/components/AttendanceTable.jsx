export default function AttendanceTable({ attendance, showOverride, onOverride }) {
    if (!attendance || attendance.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No Attendance Records</div>
                <div className="empty-state-text">No data available for the selected criteria.</div>
            </div>
        );
    }

    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        <th>Roll No</th>
                        <th>Name</th>
                        <th>Gender</th>
                        <th>Status</th>
                        <th>Marked At</th>
                        {showOverride && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {attendance.map((record) => (
                        <tr key={record.id}>
                            <td>{record.roll_no}</td>
                            <td>{record.student_name || record.name}</td>
                            <td>{record.gender}</td>
                            <td>
                                <span className={`badge badge-${record.status}`}>
                                    {record.status}
                                </span>
                            </td>
                            <td>
                                {record.marked_at
                                    ? new Date(record.marked_at).toLocaleTimeString()
                                    : '-'}
                            </td>
                            {showOverride && (
                                <td>
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => onOverride(record)}
                                    >
                                        Override
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
