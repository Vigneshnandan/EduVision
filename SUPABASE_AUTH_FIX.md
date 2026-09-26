# Fix HTTP 429 Error - Supabase Auth Configuration

## ⚡ Quick Fix Steps

### Step 1: Enable Email/Password Authentication
1. Open **Supabase Dashboard** → Your Project
2. Go to **Authentication** (left sidebar)
3. Click **Providers** tab
4. Find **Email** → Toggle it **ON** (if it's off)

### Step 2: Configure Email Settings
1. Still in **Authentication** → **Providers** → **Email**
2. Scroll down to settings and configure:
   - **Autoconfirm users**: `ON` (allows registration without email confirmation)
   - **Confirm email**: `OFF` (skip email verification for testing)
   - **Require email for signup**: `ON`

### Step 3: Disable Rate Limiting (for testing)
1. Go to **Authentication** → **URL Configuration**
2. Check if there are rate limiting settings
3. If rate limiting is enabled, temporarily disable it for testing

### Step 4: Check Auth Schema
The auth table needs to be properly linked. Run this SQL in Supabase:

```sql
-- Verify auth.users table exists
SELECT COUNT(*) FROM auth.users;

-- Check if teachers table foreign key is correct
ALTER TABLE teachers 
ADD CONSTRAINT fk_teachers_auth_user_id 
FOREIGN KEY (auth_user_id) 
REFERENCES auth.users(id) ON DELETE CASCADE
ON CONFLICT DO NOTHING;
```

---

## 🔍 If It Still Shows HTTP 429

Try these steps:

### Option 1: Check Browser Console Logs
1. Open Developer Tools (F12) on web dashboard
2. Look for actual error messages in Console tab
3. Share the error details

### Option 2: Use Supabase Test Auth Endpoint
Go to SQL Editor and run:
```sql
-- Check if auth is working
SELECT id, email, created_at FROM auth.users LIMIT 10;
```

If no users exist, auth signup might be disabled.

### Option 3: Create User Manually
```sql
-- Insert a test user directly
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'viki@teacher.eduvision.com',
  crypt('viki@2026', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{}',
  '{"teacher_name":"Viki","teacher_login_id":"viki","school_id":1,"school_name":"Govt. Model School Delhi"}',
  false,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert teacher record linked to user
INSERT INTO teachers (
  teacher_name,
  teacher_login_id,
  school_id,
  auth_user_id,
  email,
  created_at
) VALUES (
  'Viki',
  'viki',
  1,
  (SELECT id FROM auth.users WHERE email = 'viki@teacher.eduvision.com' LIMIT 1),
  'viki@teacher.eduvision.com',
  NOW()
) ON CONFLICT DO NOTHING;
```

---

## 📝 Summary - What to Do

1. ✅ Open Supabase Dashboard
2. ✅ Go to **Authentication** → **Providers**
3. ✅ Enable **Email** provider
4. ✅ Set **Autoconfirm users** to **ON**
5. ✅ Set **Confirm email** to **OFF**
6. ✅ Save changes
7. ✅ Try registering again on the app

**After these changes, the app should register successfully!**
