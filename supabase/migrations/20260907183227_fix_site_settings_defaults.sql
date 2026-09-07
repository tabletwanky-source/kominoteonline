/*
# Fix site_settings default contact information

## Problem
The `site_settings` table has a default email of `support@kominote.online` which is
not the official contact email. The official email is `AI@kominote.online` and the
official phone is `+1 829-620-9249`.

## Changes
1. Alter the column default for `contact_email` from `support@kominote.online` to `AI@kominote.online`.
2. Add `contact_phone` column default of `+1 829-620-9249` (column already exists, just set default).
3. Update any existing row that still has the old fake email.

## Security
No security changes. RLS already enabled on `site_settings`.
*/

-- Fix the column default for contact_email
ALTER TABLE site_settings ALTER COLUMN contact_email SET DEFAULT 'AI@kominote.online';

-- Fix the column default for contact_phone
ALTER TABLE site_settings ALTER COLUMN contact_phone SET DEFAULT '+1 829-620-9249';

-- Update any existing rows that still have the old fake email
UPDATE site_settings
SET contact_email = 'AI@kominote.online',
    contact_phone = COALESCE(contact_phone, '+1 829-620-9249')
WHERE contact_email = 'support@kominote.online'
   OR (contact_phone IS NULL AND id = 'general');
