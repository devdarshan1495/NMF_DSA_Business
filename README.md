# Pharmacy Management System

A modern, professional pharmacy management system for handling prescription uploads and pharmacy operations.

## Features

- **Prescription Upload**: Patients can upload prescriptions with personal information
- **Pharmacy Dashboard**: Staff can view, manage, and process prescriptions
- **Secure Authentication**: Role-based access control for pharmacy staff
- **File Storage**: Secure storage for prescription documents
- **Real-time Updates**: Live data synchronization
- **Professional UI**: Clean, modern interface with smooth animations

## Technology Stack

- **Frontend**: Pure HTML, CSS, Vanilla JavaScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth

## Getting Started

### 1. First-Time Setup

Before using the pharmacy portal, create a staff account:

1. Open `setup-staff.html` in your browser
2. Fill in the staff member details
3. Click "Create Staff Account"
4. Use these credentials to log into the pharmacy portal

### 2. Using the System

#### For Patients (Upload Prescription)
1. Open `index.html`
2. Fill in your information
3. Upload your prescription file (PDF, PNG, JPG)
4. Submit

#### For Pharmacy Staff (Dashboard)
1. Open `pharmacy.html`
2. Log in with your staff credentials
3. View and manage prescriptions
4. Update prescription status
5. Search and filter prescriptions

## Pages

- **index.html**: Patient prescription upload page
- **pharmacy.html**: Pharmacy staff dashboard
- **setup-staff.html**: One-time setup for creating staff accounts

## Migrating to Firebase

To migrate this project to Firebase:

1. Replace Supabase client initialization in `js/supabase-client.js` with Firebase config
2. Update authentication methods to use Firebase Auth
3. Replace database queries with Firestore queries
4. Update storage methods to use Firebase Storage

The code structure is designed to make this migration straightforward.

## Database Schema

### prescriptions
- Patient information
- Doctor details
- File references
- Status tracking
- Timestamps

### pharmacy_staff
- Staff credentials
- Role management
- Active status

## Security

- Row Level Security (RLS) enabled on all tables
- Pharmacy staff authentication required for dashboard access
- Secure file upload with validation
- Role-based permissions
