export default function PeriodIndicator({ session }) {
    if (!session) return null;

    if (!session.isWorkingDay) {
        return (
            <div className="session-card">
                <div className="session-header">
                    <div>
                        <div className="session-date">{session.day}</div>
                        <div className="session-day">No Classes Today</div>
                    </div>
                    <div className="session-badge">🏖️ Holiday</div>
                </div>
                <p style={{ opacity: 0.9 }}>Enjoy your day off! Classes resume tomorrow.</p>
            </div>
        );
    }

    if (session.isBreak) {
        return (
            <div className="session-card">
                <div className="session-header">
                    <div>
                        <div className="session-date">{session.date}</div>
                        <div className="session-day">{session.day}</div>
                    </div>
                    <div className="session-badge">🍽️ Break Time</div>
                </div>
                <p style={{ opacity: 0.9 }}>{session.message}</p>
            </div>
        );
    }

    if (!session.currentPeriod) {
        return (
            <div className="session-card">
                <div className="session-header">
                    <div>
                        <div className="session-date">{session.date}</div>
                        <div className="session-day">{session.day}</div>
                    </div>
                    <div className="session-badge">⏰ Outside Hours</div>
                </div>
                <p style={{ opacity: 0.9 }}>{session.message}</p>
            </div>
        );
    }

    return (
        <div className="session-card">
            <div className="session-header">
                <div>
                    <div className="session-date">{session.date}</div>
                    <div className="session-day">{session.day}</div>
                </div>
                <div className="session-badge">
                    {session.isSubmitted ? '✓ Submitted' : session.canSubmit ? '🟢 Active' : '🔒 Locked'}
                </div>
            </div>

            <div className="session-details">
                <div className="session-item">
                    <div className="session-icon">📚</div>
                    <div>
                        <div className="session-item-label">Period</div>
                        <div className="session-item-value">{session.periodLabel}</div>
                    </div>
                </div>

                <div className="session-item">
                    <div className="session-icon">⏰</div>
                    <div>
                        <div className="session-item-label">Time</div>
                        <div className="session-item-value">{session.timeRange}</div>
                    </div>
                </div>

                <div className="session-item">
                    <div className="session-icon">📖</div>
                    <div>
                        <div className="session-item-label">Subject</div>
                        <div className="session-item-value">
                            {session.subject?.name || 'N/A'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
