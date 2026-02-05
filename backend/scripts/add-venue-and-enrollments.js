import pool from '../config/database.js';

async function updateDatabase() {
    try {
        console.log('Adding venue column and sample data...\n');

        // 1. Add venue column if it doesn't exist
        try {
            await pool.execute(`ALTER TABLE activities ADD COLUMN venue VARCHAR(255) DEFAULT NULL AFTER schedule`);
            console.log('Added venue column to activities table');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Venue column already exists');
            } else {
                throw err;
            }
        }

        // 2. Update activities with venue information
        const venueUpdates = [
            { name: 'Football Training', venue: 'Main Sports Ground' },
            { name: 'Basketball Club', venue: 'Indoor Sports Hall' },
            { name: 'Volleyball Training', venue: 'Outdoor Courts' },
            { name: 'Badminton Club', venue: 'Indoor Sports Hall' },
            { name: 'Swimming', venue: 'School Swimming Pool' },
            { name: 'Cricket Academy', venue: 'Cricket Ground' },
            { name: 'Track & Field', venue: 'Athletics Track' },
            { name: 'Table Tennis', venue: 'Recreation Room' },
            { name: 'Yoga & Wellness', venue: 'Yoga Studio - Block B' },
            { name: 'Guitar Classes', venue: 'Music Room 1' },
            { name: 'Classical Dance', venue: 'Dance Studio' },
            { name: 'Art & Painting', venue: 'Art Room' },
            { name: 'Drama Club', venue: 'Auditorium' },
            { name: 'Chess Club', venue: 'Library Hall' },
            { name: 'Robotics Club', venue: 'Computer Lab 2' },
            { name: 'Debate Club', venue: 'Seminar Hall' },
            { name: 'Photography Club', venue: 'Media Room' },
            { name: 'Creative Writing', venue: 'English Lab' },
            { name: 'Science Experiments', venue: 'Science Lab 1' }
        ];

        for (const update of venueUpdates) {
            await pool.execute(
                'UPDATE activities SET venue = ? WHERE name = ?',
                [update.venue, update.name]
            );
        }
        console.log('Updated venue for all activities');

        // 3. Get some activities for enrollment
        const [activities] = await pool.execute(
            'SELECT id, name, coach_name FROM activities LIMIT 10'
        );

        // 4. Get existing enrollments count
        const [existingEnrollments] = await pool.execute(
            'SELECT COUNT(*) as count FROM activity_enrollments'
        );
        
        console.log(`\nFound ${existingEnrollments[0].count} existing enrollments`);

        // 5. Add sample enrollments (students 1-5 in various activities)
        const footballActivity = activities.find(a => a.name === 'Football Training');
        const basketballActivity = activities.find(a => a.name === 'Basketball Club');
        
        const enrollmentData = [
            // John Smith's activities (Football, Basketball)
            { student_id: 1, activity_id: footballActivity?.id, status: 'approved' },
            { student_id: 2, activity_id: footballActivity?.id, status: 'approved' },
            { student_id: 3, activity_id: footballActivity?.id, status: 'active' },
            { student_id: 1, activity_id: basketballActivity?.id, status: 'approved' },
            { student_id: 4, activity_id: basketballActivity?.id, status: 'active' },
            { student_id: 5, activity_id: basketballActivity?.id, status: 'approved' },
        ];

        let addedCount = 0;
        for (const enrollment of enrollmentData) {
            if (!enrollment.activity_id) continue;
            
            // Check if enrollment already exists
            const [existing] = await pool.execute(
                'SELECT id FROM activity_enrollments WHERE student_id = ? AND activity_id = ?',
                [enrollment.student_id, enrollment.activity_id]
            );
            
            if (existing.length === 0) {
                await pool.execute(
                    'INSERT INTO activity_enrollments (student_id, activity_id, status, notes) VALUES (?, ?, ?, ?)',
                    [enrollment.student_id, enrollment.activity_id, enrollment.status, 'Sample enrollment for testing']
                );
                addedCount++;
            }
        }
        console.log(`Added ${addedCount} new sample enrollments`);

        // 6. Show summary
        console.log('\n--- Summary ---');
        const [activitySummary] = await pool.execute(`
            SELECT a.name, a.venue, a.coach_name,
                   COUNT(CASE WHEN e.status = 'active' THEN 1 END) as pending,
                   COUNT(CASE WHEN e.status = 'approved' THEN 1 END) as approved
            FROM activities a
            LEFT JOIN activity_enrollments e ON a.id = e.activity_id
            GROUP BY a.id
            ORDER BY approved DESC, pending DESC
            LIMIT 10
        `);
        
        console.log('\nTop Activities with Enrollments:');
        activitySummary.forEach(a => {
            console.log(`  ${a.name} (${a.coach_name})`);
            console.log(`    Venue: ${a.venue || 'Not set'}`);
            console.log(`    Pending: ${a.pending}, Approved: ${a.approved}`);
        });

        console.log('\n✓ Database updated successfully!');
        console.log('\n--- How the system works ---');
        console.log('1. STUDENTS: Go to "Browse Activities" tab and click "Enroll Now"');
        console.log('2. COACHES: See pending requests in "Pending Approvals" tab');
        console.log('3. COACHES: Click "Approve" to approve student enrollment');
        console.log('4. COACHES: Go to "Attendance" tab to mark attendance for APPROVED students');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

updateDatabase();
