create table profiles (
  id uuid primary key,
  full_name text not null,
  email text unique not null,
  role text not null check (role in ('admin', 'viewer')),
  department text,
  created_at timestamptz not null default now()
);

create table incidents (
  id uuid primary key default gen_random_uuid(),
  incident_id text unique not null,
  title text not null,
  reporter_name text not null,
  designation text,
  department text,
  contact text,
  email text,
  incident_date date not null,
  incident_time text not null,
  site text not null,
  specific_location text not null,
  impacted_area_system text not null,
  incident_type text not null,
  other_incident_type text,
  severity text not null,
  description text not null,
  facilities_action text,
  vendor_action text,
  critical_load_affected boolean not null default false,
  mitigation_applied text,
  impact_on_operations text not null,
  system_restored boolean not null default false,
  restored_at timestamptz,
  root_cause text,
  root_cause_category text,
  recommendations text,
  lessons_learned text,
  follow_up_required boolean not null default false,
  responsible_person text,
  target_completion_date date,
  action_status text not null default 'Open',
  approval_status text not null default 'Pending',
  reviewed_by text,
  review_comments text,
  submitted_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table incident_comments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  user_id uuid,
  user_name text not null,
  user_email text not null,
  comment_text text not null,
  created_at timestamptz not null default now()
);
