# Vercel Deployment Guide

Complete step-by-step guide for deploying to Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier)
- Code pushed to GitHub repository

## Part 1: Push Code to GitHub

### 1.1 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `itr-bill-tracker`
3. Description: `ITR Bill Tracker - Iowa General Assembly Bill Tracker Backend`
4. Choose **Public** or **Private**
5. Click **Create repository**

### 1.2 Push Local Code

```bash
cd /Users/chrishagenow/ITR\ Dropbox/Chris\ Hagenow/ITR\ Bill\ Tracker/itr-bill-tracker

# Add remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/itr-bill-tracker.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

Verify code is on GitHub by visiting: `https://github.com/YOUR-USERNAME/itr-bill-tracker`

---

## Part 2: Create Vercel Project

### 2.1 Sign In to Vercel

1. Go to https://vercel.com
2. Click **Sign Up** or **Log In**
3. Choose **GitHub** as authentication method
4. Authorize Vercel to access your GitHub account

### 2.2 Import GitHub Repository

1. After signing in, click **Create New Project** or **Add New**
2. Under "Import Git Repository", search for `itr-bill-tracker`
3. Click the repository to select it
4. Click **Import**

### 2.3 Configure Project

**Framework Preset:**
- Should auto-detect as **Next.js**

**Root Directory:**
- Leave as `.` (default)

**Build Command:**
- Leave as default (`npm run build`)

**Output Directory:**
- Leave as default (`.next`)

**Environment Variables:**
- Skip for now (we'll add these next)

**Click "Deploy"**

The first deployment will fail (expected) because we don't have environment variables yet.

---

## Part 3: Create Vercel Postgres Database

### 3.1 Add Postgres Storage

1. In Vercel dashboard for your project, click **Storage** tab
2. Click **Create New**
3. Select **Postgres**
4. Accept terms of service
5. Click **Continue**

### 3.2 Configure Database

**Region:** Select `US East (N. Virginia)` (or your preference)

**Database Name:** `itr-bill-tracker` (or your choice)

**Click "Create"**

Wait for the database to be provisioned (1-2 minutes).

### 3.3 Get Connection String

1. Click on your database in the Storage tab
2. Click the **.env.local** tab
3. You'll see:
   ```
   POSTGRES_URL="postgresql://..."
   ```
4. **Copy the entire connection string** (including quotes)
5. Save it somewhere safe temporarily

---

## Part 4: Initialize Database Schema

### 4.1 Using Vercel Web Console (Easiest)

1. In Storage tab, click your Postgres database
2. Click the **Data** tab
3. Look for a SQL query editor
4. Open the file: `lib/db/schema.sql` from your project
5. Copy the entire SQL content
6. Paste into the SQL editor
7. Click **Execute** or **Run Query**

Wait for success message.

### 4.2 Verify Schema (Alternative)

If Vercel doesn't have a web SQL editor, use this approach:

```bash
# Get your POSTGRES_URL from Step 3.3
export POSTGRES_URL="postgresql://..."

# Run the schema
psql $POSTGRES_URL < lib/db/schema.sql

# Verify tables were created
psql $POSTGRES_URL -c "\dt"

# Should show:
# - bills table
# - admin_logs table
```

---

## Part 5: Add Environment Variables

### 5.1 In Vercel Dashboard

1. Go to your project in Vercel
2. Click **Settings** (gear icon)
3. Click **Environment Variables** in left menu
4. Click **Add New** environment variable

### 5.2 Add POSTGRES_URL

**Variable Name:** `POSTGRES_URL`

**Value:** *(Paste the connection string from Part 3)*

**Select all environments:**
- ✅ Production
- ✅ Preview
- ✅ Development

Click **Save**

### 5.3 Add ADMIN_PASSWORD

**Variable Name:** `ADMIN_PASSWORD`

**Value:** *(Enter a strong password - 20+ characters recommended)*

Examples of good passwords:
- `MyITR@BillTracker2024SecurePass!`
- `Iowa.Tax.Relief.2024#Advanced`

**Select all environments:**
- ✅ Production
- ✅ Preview
- ✅ Development

Click **Save**

---

## Part 6: Deploy to Production

### 6.1 Trigger Redeploy

After adding environment variables, redeploy:

**Option A: Automatic**
```bash
cd /Users/chrishagenow/ITR\ Dropbox/Chris\ Hagenow/ITR\ Bill\ Tracker/itr-bill-tracker

# Make a small change and push (triggers auto-deploy)
echo "# Deployment: $(date)" >> DEPLOYMENT_LOG.md
git add DEPLOYMENT_LOG.md
git commit -m "Trigger deployment with environment variables"
git push
```

**Option B: Manual Redeploy**
1. In Vercel dashboard, go to **Deployments**
2. Find your failed deployment
3. Click the three dots menu (...)
4. Click **Redeploy**

### 6.2 Wait for Build

Watch the deployment log:
- Building Next.js application
- Installing dependencies
- Running build command
- Deploying to edge network

Should complete in 2-5 minutes.

### 6.3 Verify Deployment Success

Once deployment completes:
1. Click the **Visit** button or your production URL
2. You should see the public bill listing page
3. Check for any errors in browser console (F12)

---

## Part 7: Test Production Features

### 7.1 Test Public Site

1. **Homepage:** `https://your-app.vercel.app/`
   - Should show empty bill list (no data yet)
   - Filter buttons should be visible
   - Stats should show 0 bills

### 7.2 Test Admin Login

1. **Go to:** `https://your-app.vercel.app/admin/login`
2. **Enter admin password** from Part 5.3
3. **Click Login**
4. Should redirect to admin dashboard

### 7.3 Test Add Bill

In admin dashboard:
1. Click **Add New Bill**
2. Fill in form with test data:
   - Bill Number: `HF 1`
   - Chamber: `House`
   - Title: `Test Bill for Production`
   - Short Title: `Test`
   - Position: `Support`
3. Click **Create Bill**
4. Should see success and bill appears in table

### 7.4 Test Public Site Update

1. Go back to homepage: `https://your-app.vercel.app/`
2. Refresh page (Ctrl+R or Cmd+R)
3. Should see your test bill in the list
4. Stats should show: Support (1)

### 7.5 Test CSV Import

1. In admin panel, click **Import CSV**
2. Download or use the `sample-bills.csv` file
3. Click **Select File** and choose it
4. Click **Import Bills**
5. Should show success message
6. Go to public site and verify 6 bills now appear (1 + 5 from import)

---

## Troubleshooting

### Build Failed

**Check these things:**
1. Go to Vercel dashboard → Deployments
2. Click on failed deployment
3. Scroll down to see build logs
4. Look for error messages

**Common issues:**
- Missing environment variables (should add them BEFORE deploying)
- Node version mismatch (Vercel usually auto-detects correctly)
- Dependency installation error (try clearing cache)

**Fix:**
1. Fix the issue locally
2. Commit and push: `git push`
3. Vercel auto-redeploys

### Database Connection Error

**Signs:**
- Admin login page loads but shows error
- Bills page shows "Failed to fetch bills"

**Fix:**
1. Verify POSTGRES_URL environment variable is set
2. Check the connection string is complete (no truncation)
3. Verify database schema was initialized
4. Check that tables exist: `psql $POSTGRES_URL -c "\dt"`

### Admin Login Fails

**Check:**
1. ADMIN_PASSWORD is set correctly
2. No extra spaces in password
3. Check browser console for errors (F12)
4. Try clearing cookies

### Site Shows 404

**This means:**
- Deployment succeeded but Next.js didn't build correctly
- Check build logs in Vercel dashboard

**Fix:**
- Verify all files are in GitHub
- Check no syntax errors in TypeScript files
- Run `npm run build` locally to test

---

## Production Checklist

Before considering deployment complete:

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] GitHub connected to Vercel
- [ ] Vercel Postgres database created
- [ ] POSTGRES_URL environment variable set
- [ ] ADMIN_PASSWORD environment variable set
- [ ] Database schema initialized
- [ ] Deployment succeeded (no errors)
- [ ] Production URL loads
- [ ] Public site displays correctly
- [ ] Admin login works
- [ ] Can create bills
- [ ] Can import CSV
- [ ] Bills appear on public site
- [ ] Stats update correctly

---

## Next Steps

### Immediate
1. Verify production site works
2. Import your actual bill data
3. Test all features

### Soon
1. Set up monitoring/alerts
2. Plan backup strategy
3. Document any customizations

### Future Enhancements
1. Add user authentication (currently single password)
2. Add rate limiting for API
3. Set up automatic daily backups
4. Add email notifications

---

## Support

### Useful Links
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Postgres Docs: https://www.postgresql.org/docs/

### Getting Help
- Check Vercel dashboard logs
- Check browser console (F12)
- Review project README.md
- Check API_DOCUMENTATION.md

---

## Rollback

If something goes wrong in production:

**Option 1: Revert to Previous Deployment**
1. Go to Vercel dashboard → Deployments
2. Find previous working deployment
3. Click the three dots (...)
4. Click **Promote to Production**

**Option 2: Revert Code in GitHub**
```bash
# See commit history
git log --oneline

# Revert to previous commit
git revert HEAD
git push

# Vercel auto-redeploys
```

---

**Deployment Status:** Ready to deploy
**Last Updated:** January 28, 2024
