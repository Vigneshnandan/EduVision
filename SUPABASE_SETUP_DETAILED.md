# Supabase Authentication Setup - Detailed Guide

## Current Status
✅ Database tables created
✅ Schools loaded in app
❌ Email/Password auth not enabled
❌ Getting HTTP 429 error

---

## 📋 Steps to Enable Authentication

### Step 1: Go to Sign In / Providers
1. Open Supabase Dashboard
2. Click **Authentication** (left sidebar)
3. Click **Sign In / Providers** (in left menu under CONFIGURATION)

### Step 2: Enable Email Authentication
1. Look for **Email** section
2. Click the **toggle to enable** (turn it ON)
3. You should see email options appear

### Step 3: Configure Email Settings
Make sure these are set:
- ✅ **Autoconfirm users**: `Enabled`
- ✅ **Confirm email**: `Disabled` (for testing - enable in production)
- ✅ **Allow sign up**: `Enabled`

### Step 4: Save Settings
Click **Save** or **Update** button

---

## 🔐 Additional Configuration

### Check Rate Limits
1. Go to **Authentication** → **Rate Limits** (in sidebar)
2. Make sure rate limiting is not too strict
3. For testing, you can temporarily disable it

### Verify Database Connection
The app needs these tables linked:
- ✅ `auth.users` (Supabase default auth table)
- ✅ `teachers` (linked to auth.users)
- ✅ `schools`
- ✅ `students`
- ✅ `attendance`

---

## ⚠️ If Email Still Doesn't Work

Run this SQL in Supabase SQL Editor to manually enable auth:

```sql
-- Create a test user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@teacher.eduvision.com',
  crypt('Test@2026', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Verify it worked
SELECT id, email, created_at FROM auth.users LIMIT 5;
```

---

## 🧪 Test After Configuration

1. Go back to your phone app
2. Try registering with:
   - Name: `viki`
   - ID: `1`
   - School: `Govt. Model School Delhi`
   - Password: `viki@2026`
   - Confirm: `viki@2026`

3. Expected: ✅ Registration successful (no error)

---

## 🎯 Checklist

- [ ] Clicked "Sign In / Providers"
- [ ] Enabled Email provider (toggle ON)
- [ ] Set Autoconfirm users to ON
- [ ] Set Confirm email to OFF
- [ ] Saved changes
- [ ] Checked Rate Limits are not blocking
- [ ] Tried registration on app again

**Once all done, try registering on the app again! 🚀**
