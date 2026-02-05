# Extra-Curricular Activity Module - Backend

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Database
1. Make sure PostgreSQL is installed and running
2. Create a database named `erp_db` (or update `.env` with your database name)
3. Update `.env` file with your database credentials

### 3. Create Database Tables
Run the SQL schema to create required tables:
```bash
psql -U postgres -d erp_db -f config/schema.sql
```

Or manually run the SQL from `config/schema.sql` in your PostgreSQL client.

### 4. Start the Server
Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Activities
- `GET /api/activities` - Get all activities (query: ?category=sports)
- `GET /api/activities/:id` - Get single activity
- `POST /api/activities` - Create new activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity
- `GET /api/activities/by-category` - Get activities grouped by category

### Enrollments
- `POST /api/enrollments` - Enroll student
- `GET /api/enrollments/student/:studentId` - Get student's enrollments
- `GET /api/enrollments/activity/:activityId` - Get activity's enrollments
- `GET /api/enrollments/stats` - Get enrollment statistics
- `PATCH /api/enrollments/:enrollmentId/withdraw` - Withdraw enrollment
- `DELETE /api/enrollments/:enrollmentId` - Delete enrollment

## Testing APIs

Use Postman, Thunder Client, or curl:

```bash
# Get all activities
curl http://localhost:5000/api/activities

# Create activity
curl -X POST http://localhost:5000/api/activities \
  -H "Content-Type: application/json" \
  -d '{"name":"Swimming","category":"sports","coach_name":"Coach Mike","schedule":"Tue/Thu 5-6 PM"}'

# Enroll student
curl -X POST http://localhost:5000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"student_id":1001,"activity_id":1}'

# Get student enrollments
curl http://localhost:5000/api/enrollments/student/1001
```

## Integration Notes for Main ERP

1. **Authentication**: Add auth middleware to routes
2. **Student Validation**: Link student_id to main student table
3. **Permissions**: Restrict activity creation to admin/teacher
4. **Database**: Update connection config to use main ERP database
5. **Routes**: Keep routes under /api/activities and /api/enrollments for easy integration

## Project Structure
```
backend/
├── config/
│   ├── database.js      # MySQL connection pool
│   └── schema.sql       # Database schema
├── controllers/
│   ├── activityController.js
│   └── enrollmentController.js
├── routes/
│   ├── activityRoutes.js
│   └── enrollmentRoutes.js
├── .env                 # Environment variables
├── .env.example         # Example env file
├── server.js            # Express server
└── package.json
```
