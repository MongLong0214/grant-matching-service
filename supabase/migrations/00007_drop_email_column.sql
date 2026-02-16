-- Remove unused email column from diagnoses (code already removed email field)
ALTER TABLE diagnoses DROP COLUMN IF EXISTS email;
