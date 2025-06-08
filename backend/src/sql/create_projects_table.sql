-- Create the projects metadata table if it doesn't exist
CREATE TABLE IF NOT EXISTS _meta_projects (
  id UUID PRIMARY KEY DEFAULT uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
