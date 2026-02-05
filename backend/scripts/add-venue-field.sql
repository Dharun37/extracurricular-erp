-- Add venue field to activities table
-- Run this migration to add the venue column

ALTER TABLE activities 
ADD COLUMN venue VARCHAR(255) AFTER coach_name;

-- Update existing records with default venue
UPDATE activities 
SET venue = 
    CASE 
        WHEN category = 'sports' THEN 'Sports Ground'
        WHEN category = 'music' THEN 'Music Room'
        WHEN category = 'dance' THEN 'Dance Studio'
        WHEN category = 'art' THEN 'Art Room'
        WHEN category = 'drama' THEN 'Auditorium'
        WHEN category = 'technology' THEN 'Computer Lab'
        ELSE 'Main Hall'
    END
WHERE venue IS NULL;
