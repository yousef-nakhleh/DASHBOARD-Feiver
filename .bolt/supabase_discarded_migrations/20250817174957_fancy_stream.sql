/*
  # Add custom duration support to appointments

  1. Schema Changes
    - Add `duration_min` column to `appointments` table
    - This allows appointments to have custom durations that override the service default
    - Column is nullable - if NULL, falls back to service.duration_min

  2. Notes
    - This enables per-appointment duration customization
    - Maintains backward compatibility with existing appointments
*/

-- Add duration_min column to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS duration_min integer;

-- Add comment for documentation
COMMENT ON COLUMN appointments.duration_min IS 'Custom duration for this appointment in minutes. If NULL, uses service.duration_min';