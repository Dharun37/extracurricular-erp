import pool from '../config/database.js';

async function fixCoachMapping() {
    try {
        console.log('Fixing coach-activity mapping...\n');

        // Update Basketball Club to John Smith (he handles Football, so adding Basketball makes sense)
        await pool.execute(
            "UPDATE activities SET coach_name = 'Coach John Smith' WHERE name = 'Basketball Club'"
        );
        console.log('Updated: Basketball Club -> Coach John Smith');

        // Update Swimming to Sarah Johnson (she handles Volleyball, Badminton, Yoga - athletic activities)
        await pool.execute(
            "UPDATE activities SET coach_name = 'Coach Sarah Johnson' WHERE name = 'Swimming'"
        );
        console.log('Updated: Swimming -> Coach Sarah Johnson');

        // Update Chess Club to Emily Brown (she handles Creative Writing, Science - academic activities)
        await pool.execute(
            "UPDATE activities SET coach_name = 'Coach Emily Brown', category = 'academics' WHERE name = 'Chess Club'"
        );
        console.log('Updated: Chess Club -> Coach Emily Brown (category: academics)');

        // Update Debate Club to Emily Brown
        await pool.execute(
            "UPDATE activities SET coach_name = 'Coach Emily Brown' WHERE name = 'Debate Club'"
        );
        console.log('Updated: Debate Club -> Coach Emily Brown');

        // Update Art & Painting to Emily Brown (she handles Photography - art activities)
        await pool.execute(
            "UPDATE activities SET coach_name = 'Coach Emily Brown' WHERE name = 'Art & Painting'"
        );
        console.log('Updated: Art & Painting -> Coach Emily Brown');

        // Now display the updated mapping
        console.log('\n--- Updated Activity-Coach Mapping ---\n');
        
        const [activities] = await pool.execute(
            "SELECT name, category, coach_name FROM activities ORDER BY coach_name, category, name"
        );

        const grouped = {};
        activities.forEach(a => {
            if (!grouped[a.coach_name]) grouped[a.coach_name] = [];
            grouped[a.coach_name].push(`  - ${a.name} (${a.category})`);
        });

        for (const coach in grouped) {
            console.log(`\n${coach}:`);
            grouped[coach].forEach(a => console.log(a));
        }

        console.log('\n\nDone! All activities now have relevant coaches assigned.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

fixCoachMapping();
