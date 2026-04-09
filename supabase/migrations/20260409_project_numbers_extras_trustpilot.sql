-- 1. Project numbers (auto-increment)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_number SERIAL;

-- Backfill existing projects in creation order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM projects
)
UPDATE projects SET project_number = numbered.rn
FROM numbered WHERE projects.id = numbered.id;

-- Ensure future inserts get the next value after backfill
SELECT setval(
  pg_get_serial_sequence('projects', 'project_number'),
  COALESCE((SELECT MAX(project_number) FROM projects), 0)
);

-- 2. Trustpilot manual control
ALTER TABLE projects ADD COLUMN IF NOT EXISTS show_trustpilot BOOLEAN DEFAULT false;

-- 3. Extra offers flag
ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_extra BOOLEAN DEFAULT false;
