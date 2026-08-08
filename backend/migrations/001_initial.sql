CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS storage_subsections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES storage_locations(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, location_id)
);

CREATE TABLE IF NOT EXISTS supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL CHECK (unit IN ('g', 'kg', 'l', 'pack', 'bottle')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supply_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id UUID NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('primary', 'backup')),
  location_id UUID NOT NULL REFERENCES storage_locations(id),
  subsection_id UUID NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supply_id, role),
  FOREIGN KEY (subsection_id, location_id)
    REFERENCES storage_subsections(id, location_id)
);

CREATE INDEX IF NOT EXISTS supply_assignments_primary_location_idx
  ON supply_assignments (location_id)
  WHERE role = 'primary';

CREATE INDEX IF NOT EXISTS supply_assignments_primary_subsection_idx
  ON supply_assignments (subsection_id)
  WHERE role = 'primary';

CREATE INDEX IF NOT EXISTS supply_assignments_backup_location_idx
  ON supply_assignments (location_id)
  WHERE role = 'backup';

CREATE INDEX IF NOT EXISTS supplies_name_lower_idx
  ON supplies (LOWER(name));
