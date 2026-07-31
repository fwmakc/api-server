-- LMS Performance Seed Data
-- Target: ~10K students, 10 courses, ~750 modules (tree), ~5K tasks, ~20K activities, ~1M results

-- ── Students: 10,000 ──
INSERT INTO lms_students (username, full_name, created_at)
SELECT
  'student_' || g,
  'Student ' || g || ' ' || CASE WHEN g % 5 = 0 THEN 'Ivanov' WHEN g % 5 = 1 THEN 'Petrov' WHEN g % 5 = 2 THEN 'Sidorov' WHEN g % 5 = 3 THEN 'Kozlov' ELSE 'Smirnov' END,
  now() - (random() * 365)::int * interval '1 day'
FROM generate_series(1, 10000) g;

-- ── Courses: 10 ──
INSERT INTO lms_courses (title, description, created_at)
SELECT
  'Course ' || g,
  'Description for course ' || g,
  now() - (g * 10)::int * interval '1 day'
FROM generate_series(1, 10) g;

-- ── Flows: 3-5 per course (~40 total) ──
INSERT INTO lms_flows (course_id, name, start_date, max_students, created_at)
SELECT
  c.id,
  'Flow ' || c.id || '.' || g,
  now() + (g * 7)::int * interval '1 day',
  20 + floor(random() * 20)::int,
  now()
FROM lms_courses c
CROSS JOIN LATERAL generate_series(1, 3 + floor(random() * 3)::int) g;

-- ── Enrolls: each student in 1-4 random courses (~25K total) ──
INSERT INTO lms_enrolls (student_id, course_id, flow_id, status, created_at)
SELECT
  s.id,
  1 + floor(random() * 10)::int,
  1 + floor(random() * (SELECT count(*) FROM lms_flows))::int,
  CASE
    WHEN random() < 0.8 THEN 'active'
    WHEN random() < 0.5 THEN 'completed'
    ELSE 'dropped'
  END,
  now() - (random() * 180)::int * interval '1 day'
FROM lms_students s
CROSS JOIN LATERAL generate_series(1, 1 + floor(random() * 4)::int) g;

-- ── Modules Level 0: 10-20 root modules per course (~150) ──
INSERT INTO lms_modules (course_id, parent_module_id, title, position, created_at)
SELECT c.id, NULL, 'Module ' || c.id || '.' || g, g, now()
FROM lms_courses c
CROSS JOIN LATERAL generate_series(1, 10 + floor(random() * 11)::int) g;

-- ── Modules Level 1: 3-5 children per root (~550) ──
INSERT INTO lms_modules (course_id, parent_module_id, title, position, created_at)
SELECT m.course_id, m.id, 'Submodule ' || m.id || '.' || g, g, now()
FROM lms_modules m
CROSS JOIN LATERAL generate_series(1, 3 + floor(random() * 3)::int) g
WHERE m.parent_module_id IS NULL;

-- ── Modules Level 2: 2-3 children for ~50% of level-1 modules (~500) ──
INSERT INTO lms_modules (course_id, parent_module_id, title, position, created_at)
SELECT m.course_id, m.id, 'Section ' || m.id || '.' || g, g, now()
FROM lms_modules m
CROSS JOIN LATERAL generate_series(1, 2 + floor(random() * 2)::int) g
WHERE m.parent_module_id IS NOT NULL
  AND m.parent_module_id IN (SELECT id FROM lms_modules WHERE parent_module_id IS NULL)
  AND random() < 0.5;

-- ── Modules Level 3: 1-2 children for ~30% of level-2 modules (~200) ──
INSERT INTO lms_modules (course_id, parent_module_id, title, position, created_at)
SELECT m.course_id, m.id, 'Unit ' || m.id || '.' || g, g, now()
FROM lms_modules m
CROSS JOIN LATERAL generate_series(1, 1 + floor(random() * 2)::int) g
WHERE m.parent_module_id IS NOT NULL
  AND m.parent_module_id IN (
    SELECT id FROM lms_modules
    WHERE parent_module_id IS NOT NULL
      AND parent_module_id IN (SELECT id FROM lms_modules WHERE parent_module_id IS NULL)
  )
  AND random() < 0.3;

-- ── Tasks: 5-10 per module (~5,000) ──
INSERT INTO lms_tasks (module_id, title, position, created_at)
SELECT m.id, 'Task ' || m.id || '.' || g, g, now()
FROM lms_modules m
CROSS JOIN LATERAL generate_series(1, 5 + floor(random() * 6)::int) g;

-- ── Activities: 3-5 per task (~20,000) ──
INSERT INTO lms_activities (task_id, type, title, max_score, created_at)
SELECT
  t.id,
  (ARRAY['quiz', 'text', 'video', 'assignment'])[1 + floor(random() * 4)::int],
  'Activity ' || t.id || '.' || g,
  50 + floor(random() * 50)::int,
  now()
FROM lms_tasks t
CROSS JOIN LATERAL generate_series(1, 3 + floor(random() * 3)::int) g;

-- ── Activities Results: ~40 per enrollment (~1M) ──
-- Fast: pre-aggregate activity IDs per course into arrays, then pick random elements
WITH course_activities AS MATERIALIZED (
  SELECT
    m.course_id,
    array_agg(a.id) AS activity_ids
  FROM lms_activities a
  JOIN lms_tasks t ON t.id = a.task_id
  JOIN lms_modules m ON m.id = t.module_id
  GROUP BY m.course_id
)
INSERT INTO lms_activities_results (student_id, activity_id, attempt_number, score, is_correct, created_at)
SELECT
  e.student_id,
  ca.activity_ids[1 + floor(random() * array_length(ca.activity_ids, 1))::int],
  1 + floor(random() * 3)::int,
  floor(random() * 100)::int,
  CASE WHEN random() < 0.35 THEN 1 ELSE 0 END,
  now() - (random() * 90)::int * interval '1 day'
FROM lms_enrolls e
JOIN course_activities ca ON ca.course_id = e.course_id
CROSS JOIN LATERAL generate_series(1, 20 + floor(random() * 40)::int) g
WHERE e.status != 'dropped';

-- ── Verify counts ──
SELECT 'lms_students' AS t, count(*) AS n FROM lms_students
UNION ALL SELECT 'lms_courses', count(*) FROM lms_courses
UNION ALL SELECT 'lms_flows', count(*) FROM lms_flows
UNION ALL SELECT 'lms_enrolls', count(*) FROM lms_enrolls
UNION ALL SELECT 'lms_modules', count(*) FROM lms_modules
UNION ALL SELECT 'lms_modules L0', count(*) FROM lms_modules WHERE parent_module_id IS NULL
UNION ALL SELECT 'lms_modules L1', count(*) FROM lms_modules WHERE parent_module_id IS NOT NULL AND parent_module_id IN (SELECT id FROM lms_modules WHERE parent_module_id IS NULL)
UNION ALL SELECT 'lms_tasks', count(*) FROM lms_tasks
UNION ALL SELECT 'lms_activities', count(*) FROM lms_activities
UNION ALL SELECT 'lms_results', count(*) FROM lms_activities_results;
