import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    getCurrentUser: () => api.get('/auth/me'),
    changePassword: (currentPassword, newPassword) =>
        api.post('/auth/change-password', { currentPassword, newPassword })
};

// Attendance API
export const attendanceAPI = {
    getCurrentSession: () => api.get('/attendance/session'),
    getStudents: () => api.get('/attendance/students'),
    getTodayTimetable: () => api.get('/attendance/timetable/today'),
    getSubjects: () => api.get('/attendance/subjects'),
    getAttendanceByPeriod: (date, period) =>
        api.get('/attendance/by-period', { params: { date, period } }),
    markAttendance: (attendance) => api.post('/attendance/mark', { attendance }),
    getFilteredAttendance: (filters) =>
        api.get('/attendance/filtered', { params: filters }),
    overrideAttendance: (id, status, reason) =>
        api.put(`/attendance/override/${id}`, { status, reason }),
    getAuditLogs: (limit = 50) => api.get('/attendance/audit-logs', { params: { limit } }),
    getLiveAttendance: () => api.get('/attendance/live')
};

// Reports API
export const reportsAPI = {
    getPeriodReport: (date, period) =>
        api.get('/reports/period', { params: { date, period } }),
    getDailyReport: (date) =>
        api.get('/reports/daily', { params: { date } }),
    getStudentReport: (studentId, startDate, endDate) =>
        api.get('/reports/student', { params: { studentId, startDate, endDate } }),
    getSubjectReport: (subjectId, startDate, endDate) =>
        api.get('/reports/subject', { params: { subjectId, startDate, endDate } }),
    downloadPeriodPDF: (date, period) =>
        `${API_BASE_URL}/reports/download/period?date=${date}&period=${period}&token=${localStorage.getItem('token')}`,
    downloadDailyPDF: (date) =>
        `${API_BASE_URL}/reports/download/daily?date=${date}&token=${localStorage.getItem('token')}`,
    downloadStudentPDF: (studentId, startDate, endDate) =>
        `${API_BASE_URL}/reports/download/student?studentId=${studentId}&startDate=${startDate}&endDate=${endDate}&token=${localStorage.getItem('token')}`
};

export default api;
