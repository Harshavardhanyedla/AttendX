export default function StudentCard({ student, status, onToggle, disabled }) {
    const getInitials = (name) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className={`student-card ${status || ''}`}>
            <div className="student-avatar">{getInitials(student.name)}</div>
            <div className="student-info">
                <div className="student-name">{student.name}</div>
                <div className="student-roll">
                    {student.roll_no} • {student.gender}
                </div>
            </div>
            <div className="student-toggle">
                <button
                    className={`toggle-btn present-btn ${status === 'present' ? 'active' : ''}`}
                    onClick={() => onToggle(student.id, 'present')}
                    disabled={disabled}
                    title="Mark Present"
                >
                    ✓
                </button>
                <button
                    className={`toggle-btn absent-btn ${status === 'absent' ? 'active' : ''}`}
                    onClick={() => onToggle(student.id, 'absent')}
                    disabled={disabled}
                    title="Mark Absent"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
