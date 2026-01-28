-- Bills table for storing Iowa General Assembly bills
CREATE TABLE IF NOT EXISTS bills (
  id SERIAL PRIMARY KEY,
  bill_number VARCHAR(20) UNIQUE NOT NULL,
  companion_bills VARCHAR(255),
  chamber VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  short_title VARCHAR(255) NOT NULL,
  description TEXT,
  committee VARCHAR(255),
  committee_key VARCHAR(100),
  status VARCHAR(100),
  position VARCHAR(50) NOT NULL CHECK (position IN ('Support', 'Against', 'Monitor', 'Undecided')),
  sponsor VARCHAR(255),
  subcommittee VARCHAR(255),
  fiscal_note BOOLEAN DEFAULT FALSE,
  lsb VARCHAR(100),
  url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index on bill_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_bills_number ON bills(bill_number);

-- Index on position for filtering by support status
CREATE INDEX IF NOT EXISTS idx_bills_position ON bills(position);

-- Index on chamber for filtering by house/senate
CREATE INDEX IF NOT EXISTS idx_bills_chamber ON bills(chamber);

-- Index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at DESC);

-- Admin logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  bill_id INTEGER REFERENCES bills(id) ON DELETE SET NULL,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index on created_at for logs
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON admin_logs(created_at DESC);
