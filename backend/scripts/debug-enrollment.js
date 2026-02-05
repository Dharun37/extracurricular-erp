import pool from '../config/database.js';

async function debug() {
    try {
        // Check Basketball Club
        const [activity] = await pool.execute(
            "SELECT id, name, coach_name FROM activities WHERE name = 'Basketball Club'"
        );
        console.log('Basketball Club Activity:', activity[0]);

        // Check all enrollments for Basketball Club
        const [enrollments] = await pool.execute(
            "SELECT ae.id, ae.student_id, ae.status, a.name, a.coach_name FROM activity_enrollments ae JOIN activities a ON ae.activity_id = a.id WHERE a.name = 'Basketball Club'"
        );
        console.log('\nEnrollments for Basketball Club:');
        console.table(enrollments);

        // Check what John Smith would see (simulating the FIXED filter)
        const coachName = 'John Smith';
        const [allActivities] = await pool.execute("SELECT id, name, coach_name FROM activities");
        
        const searchName = coachName.toLowerCase().trim();
        const nameParts = searchName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        
        const filteredActivities = allActivities.filter(activity => {
            const activityCoach = activity.coach_name?.toLowerCase() || '';
            // Must match full name or first+last name pattern
            return activityCoach.includes(searchName) || 
                   (lastName && activityCoach.includes(firstName) && activityCoach.includes(lastName));
        });
        
        console.log('\nActivities John Smith should see (FIXED filter):');
        console.table(filteredActivities);

        // For each of John Smith's activities, show enrollments
        for (const act of filteredActivities) {
            const [actEnrollments] = await pool.execute(
                "SELECT ae.id, ae.student_id, ae.status FROM activity_enrollments ae WHERE ae.activity_id = ?",
                [act.id]
            );
            console.log(`\nEnrollments for ${act.name} (ID: ${act.id}):`);
            console.table(actEnrollments);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

debug();
