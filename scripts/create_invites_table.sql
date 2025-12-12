-- SQL to create invites table for Supabase
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  house_group_id uuid NOT NULL REFERENCES house_groups(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  email text,
  expires_at timestamptz,
  used_by uuid REFERENCES users(id),
  used_at timestamptz,
  revoked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invites_code_idx ON invites (code);
CREATE INDEX IF NOT EXISTS invites_house_group_idx ON invites (house_group_id);
