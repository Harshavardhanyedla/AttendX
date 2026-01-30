# ClassTrack - Attendance Management System

A complete web-based attendance management system for **I BCA – 2nd Semester** with period-wise attendance tracking.

## Features

- 🔐 **Role-based Authentication** - Admin and CR (Class Representative) roles
- 📅 **Period-wise Attendance** - Track attendance for each period (P1-P7)
- ⏰ **Auto Period Detection** - Automatically detects current day, period, and subject
- 🔒 **Auto-lock Mechanism** - Attendance locks after period ends (with 5-min grace period)
- 📊 **Live Dashboard** - Real-time attendance view for admins
- 📋 **Multiple Reports** - Period-wise, daily, student-wise, and subject-wise reports
- 📥 **PDF Export** - Download attendance reports as PDF
- 📱 **Mobile Responsive** - Works on all devices

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (better-sqlite3)
- **Frontend**: React, Vite
- **Authentication**: JWT (JSON Web Tokens)
- **PDF Generation**: PDFKit

## Project Structure

```
AttendX/
├── backend/
│   ├── config/
│   │   └── database.js         # SQLite configuration
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── attendanceController.js  # Attendance operations
│   │   └── reportController.js # Report generation
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT verification
│   ├── routes/
│   │   ├── auth.js
│   │   ├── attendance.js
│   │   └── reports.js
│   ├── utils/
│   │   ├── periodUtils.js      # Period detection utilities
│   │   └── pdfGenerator.js     # PDF generation
│   ├── seed/
│   │   └── seedData.js         # Database seeding
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── context/            # React context
│   │   ├── utils/              # API utilities
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # Design system
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone/Navigate to the project:**
   ```bash
   cd /Users/yadlaharshavardhan/Documents/AttendX
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Seed the Database:**
   ```bash
   npm run seed
   ```

4. **Start the Backend Server:**
   ```bash
   npm start
   ```
   Server runs at http://localhost:5000

5. **Install Frontend Dependencies (new terminal):**
   ```bash
   cd frontend
   npm install
   ```

6. **Start the Frontend:**
   ```bash
   npm run dev
   ```
   Frontend runs at http://localhost:5173

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| CR | cr | cr123 |

> ⚠️ **Warning**: Change these credentials in production!

## Period Timings

| Period | Time |
|--------|------|
| P1 | 09:00 – 10:00 |
| P2 | 10:00 – 11:00 |
| P3 | 11:10 – 12:05 |
| P4 | 12:05 – 13:00 |
| Break | 13:00 – 14:00 |
| P5 | 14:00 – 15:00 |
| P6 | 15:00 – 16:00 |
| P7 | 16:00 – 17:00 |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Attendance
- `GET /api/attendance/session` - Get current session info
- `GET /api/attendance/students` - Get all students
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/live` - Live attendance data (admin)
- `PUT /api/attendance/override/:id` - Override attendance (admin)

### Reports
- `GET /api/reports/period` - Period-wise report
- `GET /api/reports/daily` - Daily report
- `GET /api/reports/student` - Student report
- `GET /api/reports/subject` - Subject report
- `GET /api/reports/download/*` - PDF downloads

## Usage Guide

### For Class Representative (CR)

1. Login with CR credentials
2. View current period, time, and subject
3. Mark students as Present/Absent
4. Submit attendance before period ends
5. Cannot edit after submission

### For Admin

1. Login with Admin credentials
2. **Live View**: See real-time attendance for today
3. **View Attendance**: Filter and search attendance records
4. **Override**: Change attendance with reason (creates audit log)
5. **Reports**: Generate and download various reports

## Development

### Backend

```bash
cd backend
npm run dev      # Start in development mode
npm run seed     # Reseed database
```

### Frontend

```bash
cd frontend
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
```

## Deployment

### Backend
1. Set environment variables:
   - `PORT` (default: 5000)
   - `JWT_SECRET` (change in production!)
2. For production, consider migrating to PostgreSQL

### Frontend
1. Build: `npm run build`
2. Deploy `dist/` folder to any static hosting (Vercel, Netlify)
3. Configure API proxy or CORS

## License

MIT License

---

Built with ❤️ for I BCA – 2nd Semester
