# Supabase Database Setup Guide

## Setup Instructions

### Step 1: Create Database Tables
Run `COPY_THIS_FIRST.sql` in Supabase SQL Editor

### Step 2: Create Audit Logs
Run `COPY_THIS_SECOND.sql` in Supabase SQL Editor

### Step 3: Enable Auto-Delete for Auth Users
Run `AUTO_DELETE_AUTH_USERS.sql` in Supabase SQL Editor

This allows you to delete and recreate users with the same email.

### Step 4: Disable Email Confirmation
Authentication → Providers → Email → Toggle OFF "Confirm email"

### Step 5: Create Admin User
Run `CREATE_ADMIN.sql` or create through the app

### Important
The AUTO_DELETE_AUTH_USERS.sql script is required for proper user deletion.
Without it, you cannot recreate users with the same email after deletion.
