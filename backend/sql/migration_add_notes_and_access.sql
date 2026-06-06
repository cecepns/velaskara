-- =======================================================
-- VELASKARA KOPAY — DATABASE SCHEMA MIGRATION
-- Migration: Add notes to audit answers and manager access control
-- =======================================================

USE velaskara_assessment;

-- 1. Add note/catatan column to audit_answers table
ALTER TABLE audit_answers ADD COLUMN note TEXT DEFAULT NULL;

-- 2. Create audit_access table to store custom manager view permissions
CREATE TABLE IF NOT EXISTS audit_access (
  audit_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (audit_id, user_id),
  FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
