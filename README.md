# Extra-Curricular Activity Module

A self-contained module for managing extra-curricular activities in a School ERP system.

## 📋 Overview

This module allows:
- **Students**: Browse activities, enroll, and manage their enrollments
- **Admin/Teachers**: Create and manage extra-curricular activities
- **Integration**: Designed to be merged into a larger ERP system

## 🛠️ Tech Stack

- **Frontend**: React (Vite), CSS
- **Backend**: Node.js, Express
- **Database**: MySQL 8.0+
- **API**: RESTful endpoints

## 📁 Project Structure

```
erp-extra-curricular/
├── backend/
│   ├── config/
│   │   ├── database.js          # MySQL connection pool
│   │   └── schema.sql            # Database schema
│   ├── controllers/
│   │   ├── activityController.js
│   │   └── enrollmentController.js
│   ├── routes/
│   │   ├── activityRoutes.js
│   │   └── enrollmentRoutes.js
│   ├── .env                      # Environment variables
│   ├── server.js                 # Express server
│   ├── package.json
│   └── README.md
├── src/
│   ├── components/
│   │   └── activities/
│   │       ├── ActivityList.jsx       # Browse activities
│   │       ├── ActivityList.css
│   │       ├── ActivityForm.jsx       # Create activities (admin)
│   │       ├── ActivityForm.css
│   │       ├── StudentEnroll.jsx      # Student enrollments
│   │       └── StudentEnroll.css
│   ├── services/
│   │   └── api.js                     # API service layer
│   ├── App.jsx                        # Main app component
│   ├── App.css
│   └── main.jsx
├── public/
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- MySQL (v8.0+)
- npm or yarn

### Backend Setup

1. **Navigate to backend folder**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure database**
   - Update `backend/.env` with your MySQL credentials
   - Default configuration:
     ```
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=your_password
     DB_NAME=erp_extracurricular
     PORT=5000
     ```

4. **Create database and tables**
   ```bash
   npm run db:init  # Creates database and runs schema
   ```

5. **Start backend server**
   ```bash
   npm run dev
   ```
   
   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to root folder**
   ```bash
   cd ..
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   Frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

## 📡 API Endpoints

### Activities
- `GET /api/activities` - Get all activities
- `GET /api/activities/:id` - Get single activity
- `POST /api/activities` - Create activity (admin)
- `PUT /api/activities/:id` - Update activity (admin)
- `DELETE /api/activities/:id` - Delete activity (admin)
- `GET /api/activities/by-category` - Get activities by category

### Enrollments
- `POST /api/enrollments` - Enroll student
- `GET /api/enrollments/student/:studentId` - Get student enrollments
- `GET /api/enrollments/activity/:activityId` - Get activity enrollments
- `GET /api/enrollments/stats` - Get enrollment statistics
- `PATCH /api/enrollments/:enrollmentId/withdraw` - Withdraw enrollment
- `DELETE /api/enrollments/:enrollmentId` - Delete enrollment (admin)

## 🎯 Features

### For Students
- ✅ Browse all available activities
- ✅ Filter activities by category
- ✅ View activity details (coach, schedule, enrollment count)
- ✅ Enroll in activities
- ✅ View enrolled activities
- ✅ Withdraw from activities

### For Admin/Teachers
- ✅ Create new activities
- ✅ Edit existing activities
- ✅ Delete activities
- ✅ View enrollment statistics
- ✅ Manage student enrollments

## 🔄 Integration Notes for Main ERP

When merging this module with the main ERP system:

### Backend Integration
1. **Authentication**: Add authentication middleware to routes
2. **Authorization**: Implement role-based access control (RBAC)
3. **Student Validation**: Link `student_id` to main student table
4. **Database**: Update connection config to use main ERP database
5. **API Prefix**: Keep routes under `/api/activities` and `/api/enrollments`

### Frontend Integration
1. **Authentication Context**: Replace hardcoded `studentId` with authenticated user
2. **Role Management**: Use actual user roles from auth context
3. **Routing**: Mount as a route in main ERP router
4. **Styling**: Adapt to main ERP theme/design system
5. **API Base URL**: Update in `src/services/api.js`

### Database Integration
- Add foreign key constraint from `activity_enrollments.student_id` to main `students` table
- Consider adding user audit fields (created_by, updated_by)
- Add soft delete functionality if required by main ERP

## 🧪 Testing

### Test with Sample Data
The database schema includes sample data:
- 8 activities across different categories
- Sample enrollments for student IDs 1001-1005

### Manual Testing Steps
1. Start backend and frontend
2. Browse activities (no auth required)
3. Try enrolling with student ID 1001
4. View enrollments
5. Test withdrawal
6. Switch to admin role (change `userRole` in App.jsx to 'admin')
7. Create new activity
8. Verify activity appears in list

### API Testing
Use curl, Postman, or Thunder Client:
```bash
# Health check
curl http://localhost:5000/health

# Get activities
curl http://localhost:5000/api/activities

# Enroll student
curl -X POST http://localhost:5000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"student_id":1001,"activity_id":1}'
```

## 📝 Current Limitations

- No authentication (hardcoded student ID)
- No role-based access control
- Simple validation
- No file uploads for activity images
- No email notifications
- No attendance tracking

## 🔮 Future Enhancements

- [ ] User authentication & authorization
- [ ] Activity images/photos
- [ ] Attendance tracking
- [ ] Performance certificates
- [ ] Email/SMS notifications
- [ ] Calendar integration
- [ ] Payment integration (for paid activities)
- [ ] Activity ratings/reviews
- [ ] Admin dashboard with analytics

## 👥 Team Integration

This module is designed for easy integration:
- Self-contained with clear boundaries
- Documented code with integration notes
- Modular structure
- RESTful API design
- No tight coupling with other modules

## 📄 License

MIT

## 🤝 Contributing

This is a team project. Follow your team's Git workflow when making changes.

---

**Note**: This module is currently standalone. Update configuration files when integrating with the main ERP system.
