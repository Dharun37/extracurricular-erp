-- Migration: Add coach_id field and update activities table
-- This migration updates the activities table to use coach_id instead of coach_name

-- Step 1: Add coach_id column if it doesn't exist
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS coach_id INT NULL AFTER category,
ADD COLUMN IF NOT EXISTS venue VARCHAR(255) AFTER coach_id;

-- Step 2: Add indexes and foreign key
ALTER TABLE activities 
ADD INDEX IF NOT EXISTS idx_coach_id (coach_id);

-- Add foreign key constraint (only if not exists)
-- Note: This may fail if users table doesn't exist yet
-- In that case, run users-schema.sql first
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'activities' 
    AND CONSTRAINT_NAME = 'activities_ibfk_1'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @query = IF(
    @fk_exists = 0,
    'ALTER TABLE activities ADD FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT "Foreign key already exists" AS message'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Update existing activities with coach_id based on coach_name
-- This attempts to match coach names with users in the database

-- For Coach John Smith (ID: 2)
UPDATE activities 
SET coach_id = 2 
WHERE coach_name LIKE '%John%Smith%' AND coach_id IS NULL;

-- For Coach Sarah Johnson (ID: 3)
UPDATE activities 
SET coach_id = 3 
WHERE coach_name LIKE '%Sarah%Johnson%' AND coach_id IS NULL;

-- For Coach Mike Davis (ID: 4)
UPDATE activities 
SET coach_id = 4 
WHERE coach_name LIKE '%Mike%Davis%' AND coach_id IS NULL;

-- For Coach Emily Brown (ID: 5)
UPDATE activities 
SET coach_id = 5 
WHERE coach_name LIKE '%Emily%Brown%' AND coach_id IS NULL;

-- Step 4: Show migration summary
SELECT 
    'Migration Summary' as info,
    COUNT(*) as total_activities,
    SUM(CASE WHEN coach_id IS NOT NULL THEN 1 ELSE 0 END) as with_coach_id,
    SUM(CASE WHEN coach_id IS NULL THEN 1 ELSE 0 END) as without_coach_id
FROM activities;

-- Step 5: Optional - Drop coach_name column after confirming migration
-- Uncomment the line below only after verifying all data is migrated correctly
-- ALTER TABLE activities DROP COLUMN coach_name;

SELECT '✅ Migration completed! Review the summary above.' as status;
SELECT 'ℹ️  Note: coach_name column is retained for reference. Drop it manually after verification.' as note;
