/*
  # Pharmacy Management System Database Schema

  ## Overview
  Creates a complete database schema for managing prescription uploads and pharmacy operations

  ## 1. New Tables
  
  ### prescriptions
  Main table for storing prescription submissions
  - `id` (uuid, primary key) - Unique identifier
  - `patient_name` (text) - Patient full name
  - `patient_email` (text) - Patient email
  - `patient_phone` (text) - Patient phone number
  - `doctor_name` (text) - Prescribing doctor
  - `file_url` (text) - Storage URL for prescription file
  - `file_name` (text) - Original filename
  - `file_size` (integer) - File size in bytes
  - `status` (text) - pending, processing, completed, rejected
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Submission timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `user_id` (uuid) - References auth.users if logged in

  ### pharmacy_staff
  Stores pharmacy staff accounts
  - `id` (uuid, primary key) - Staff identifier
  - `user_id` (uuid) - References auth.users
  - `full_name` (text) - Staff name
  - `role` (text) - admin, pharmacist, technician
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Account creation

  ## 2. Security (Row Level Security)
  - All tables protected with RLS
  - Public can insert prescriptions
  - Pharmacy staff can view and update all prescriptions
  - Staff can view own profile
  - Admins can manage staff

  ## 3. Storage
  - Creates prescriptions bucket for file uploads
  - Public insert, authenticated read policies

  ## 4. Important Notes
  - Uses safe IF EXISTS/IF NOT EXISTS checks
  - Default values for all appropriate fields
  - Indexes for performance
  - Comprehensive RLS policies
*/

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  patient_email text NOT NULL,
  patient_phone text NOT NULL,
  doctor_name text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create pharmacy staff table
CREATE TABLE IF NOT EXISTS pharmacy_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'technician',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_created_at ON prescriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_staff_user_id ON pharmacy_staff(user_id);

-- Enable RLS
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_staff ENABLE ROW LEVEL SECURITY;

-- Prescriptions policies
CREATE POLICY "Anyone can insert prescriptions"
  ON prescriptions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Pharmacy staff can view all prescriptions"
  ON prescriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pharmacy_staff
      WHERE pharmacy_staff.user_id = auth.uid()
      AND pharmacy_staff.is_active = true
    )
  );

CREATE POLICY "Pharmacy staff can update prescriptions"
  ON prescriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pharmacy_staff
      WHERE pharmacy_staff.user_id = auth.uid()
      AND pharmacy_staff.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pharmacy_staff
      WHERE pharmacy_staff.user_id = auth.uid()
      AND pharmacy_staff.is_active = true
    )
  );

-- Pharmacy staff policies
CREATE POLICY "Staff can view own profile"
  ON pharmacy_staff
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage staff"
  ON pharmacy_staff
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pharmacy_staff
      WHERE pharmacy_staff.user_id = auth.uid()
      AND pharmacy_staff.role = 'admin'
      AND pharmacy_staff.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pharmacy_staff
      WHERE pharmacy_staff.user_id = auth.uid()
      AND pharmacy_staff.role = 'admin'
      AND pharmacy_staff.is_active = true
    )
  );

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can upload prescriptions"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'prescriptions');

CREATE POLICY "Authenticated users can view prescription files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'prescriptions');
