# ITR Bill Tracker - Setup Checklist

Complete this checklist to get your bill tracker fully operational.

## Pre-Setup Requirements

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] GitHub account for deployment
- [ ] Vercel account (free tier works) or Supabase account for database

---

## Phase 1: Local Setup

### Database Preparation
- [ ] Create Vercel Postgres database OR Supabase PostgreSQL instance
- [ ] Obtain PostgreSQL connection string (POSTGRES_URL)
- [ ] Test connection string works
- [ ] Have admin password ready (use strong password)

### Project Setup
- [ ] Navigate to `/itr-bill-tracker` directory
- [ ] Run `npm install` (wait for completion)
- [ ] Copy `.env.example` to `.env.local`
- [ ] Edit `.env.local` with:
  - [ ] POSTGRES_URL from your database
  - [ ] ADMIN_PASSWORD (secure password)
- [ ] Save `.env.local`

### Database Schema
- [ ] Verify you can connect to database (`psql $POSTGRES_URL` or via client)
- [ ] Run SQL schema: `psql $POSTGRES_URL < lib/db/schema.sql`
- [ ] Verify tables created:
  - [ ] `bills` table exists
  - [ ] `admin_logs` table exists
- [ ] Verify indexes created
- [ ] Check row count: `SELECT COUNT(*) FROM bills;` (should be 0)

### Local Testing
- [ ] Start dev server: `npm run dev`
- [ ] Visit http://localhost:3000
- [ ] Verify public page loads
- [ ] Check stats show 0 bills
- [ ] Try filter buttons
- [ ] Go to `/admin/login`
- [ ] Login with ADMIN_PASSWORD from env
- [ ] Verify you reach admin dashboard

---

## Phase 2: Admin Features Testing

### Add Bill (Manual)
- [ ] In admin panel, click "Add New Bill"
- [ ] Fill in required fields:
  - [ ] Bill Number: `HF 123`
  - [ ] Chamber: `House`
  - [ ] Title: `Test Bill Title`
  - [ ] Short Title: `Test`
  - [ ] Position: `Support`
- [ ] Click "Create Bill"
- [ ] Verify bill appears in table
- [ ] Go to public site `/` and verify bill appears
- [ ] Check stats updated

### Edit Bill
- [ ] In admin table, click "Edit" on the test bill
- [ ] Change position to `Against`
- [ ] Click "Update Bill"
- [ ] Verify change saved in table
- [ ] Verify change shows on public site

### Delete Bill
- [ ] In admin table, click "Delete"
- [ ] Confirm deletion
- [ ] Verify bill removed from table
- [ ] Verify bill removed from public site
- [ ] Check stats updated

### CSV Import
- [ ] Click "Import CSV" button
- [ ] Download/use `sample-bills.csv`
- [ ] Upload the file
- [ ] Verify import successful message
- [ ] Check count of imported bills (should be 5)
- [ ] Go to public site and verify 5 bills appear
- [ ] Check stats match imported data
- [ ] Try importing again - verify duplicate error for existing bills

### Logout
- [ ] Click "Logout" button
- [ ] Verify redirected to home page
- [ ] Try going to `/admin` directly
- [ ] Verify redirected to login page
- [ ] Login again with password

---

## Phase 3: API Testing (Optional)

### Public API
- [ ] Test: `curl http://localhost:3000/api/bills`
- [ ] Verify returns JSON array of bills

### Authentication
- [ ] Test login:
  ```bash
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"password":"your-password"}' \
    -c cookies.txt
  ```
- [ ] Verify returns success message
- [ ] Check cookies.txt file created

### Protected Endpoints
- [ ] Test create:
  ```bash
  curl -X POST http://localhost:3000/api/bills \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{"bill_number":"HF 999","chamber":"House","title":"Test","short_title":"T","position":"Support"}'
  ```
- [ ] Verify bill created

---

## Phase 4: Production Deployment

### GitHub Setup
- [ ] Create GitHub repository
- [ ] Initialize git: `git init`
- [ ] Add remote: `git remote add origin https://github.com/username/itr-bill-tracker.git`
- [ ] Commit code: `git add . && git commit -m "Initial commit"`
- [ ] Push to GitHub: `git push -u origin main`

### Vercel Deployment
- [ ] Go to https://vercel.com
- [ ] Sign in with GitHub account
- [ ] Click "New Project"
- [ ] Import the repository
- [ ] Configure project settings if needed
- [ ] Go to Settings → Environment Variables
- [ ] Add environment variables:
  - [ ] POSTGRES_URL (from production database)
  - [ ] ADMIN_PASSWORD (secure password)
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Click "Visit" to open deployed site

### Verify Production
- [ ] Visit production URL
- [ ] Verify bills display correctly
- [ ] Test login at `/admin/login`
- [ ] Add a test bill in production
- [ ] Verify it appears on public site
- [ ] Test import functionality
- [ ] Logout and login again

---

## Phase 5: Data Migration

### From Old System
- [ ] Extract all 17 bills from current HTML/JS
- [ ] Create CSV file with extracted data (use sample-bills.csv as template)
- [ ] Login to admin panel
- [ ] Import the CSV file
- [ ] Verify all bills present
- [ ] Verify all positions correct
- [ ] Verify all links work

### Data Verification
- [ ] Check total bill count: `SELECT COUNT(*) FROM bills;` (should be 17)
- [ ] Verify positions: `SELECT position, COUNT(*) FROM bills GROUP BY position;`
- [ ] Check no duplicate bill numbers
- [ ] Verify critical bills marked correctly (Support/Against)

---

## Phase 6: Maintenance Setup

### Backups
- [ ] Set up automatic database backups (if using Vercel Postgres, it's automatic)
- [ ] For Supabase, enable backups in dashboard
- [ ] Document backup location and recovery process

### Monitoring
- [ ] Set up Vercel deployment alerts (Settings → Notifications)
- [ ] Monitor error logs: Vercel dashboard → Functions
- [ ] Check database health regularly

### Documentation
- [ ] Keep `.env.example` up to date
- [ ] Update README.md if making changes
- [ ] Document any custom configurations
- [ ] Save deployment credentials securely

---

## Phase 7: Optional Enhancements

- [ ] [ ] Add custom branding/colors
- [ ] [ ] Update admin password periodically
- [ ] [ ] Add more detailed notes to bills
- [ ] [ ] Create backup CSV export of all bills
- [ ] [ ] Set up additional admin accounts (future feature)
- [ ] [ ] Add bill status update notifications (future feature)
- [ ] [ ] Integrate with legislature.iowa.gov API (future feature)

---

## Troubleshooting During Setup

### npm install fails
- [ ] Check Node.js version: `node --version` (needs 18+)
- [ ] Clear npm cache: `npm cache clean --force`
- [ ] Delete node_modules and retry: `rm -rf node_modules && npm install`

### Database connection error
- [ ] Verify POSTGRES_URL is correct and copied completely
- [ ] Test connection: `psql $POSTGRES_URL`
- [ ] Check database is running and accessible
- [ ] Verify IP whitelist for Vercel (if using managed database)

### Admin login fails
- [ ] Check ADMIN_PASSWORD in .env.local is correct
- [ ] Verify no extra spaces in password
- [ ] Restart dev server after env changes: Ctrl+C and `npm run dev`
- [ ] Clear browser cookies and try again

### Deployment fails
- [ ] Check build logs in Vercel dashboard
- [ ] Verify environment variables set in Vercel
- [ ] Ensure database is accessible from Vercel
- [ ] Check for TypeScript errors: `npm run build`

### Bills not showing on public site
- [ ] Verify bills exist in database: `SELECT * FROM bills;`
- [ ] Check API endpoint: `curl http://localhost:3000/api/bills`
- [ ] Verify JavaScript in browser console for errors
- [ ] Clear browser cache and reload

---

## Success Indicators

✅ **You know setup is complete when:**
- [ ] Public site displays all bills correctly
- [ ] Admin login works with your password
- [ ] Can add, edit, and delete bills
- [ ] CSV import works with sample data
- [ ] Production deployment succeeds
- [ ] Production site shows the same data

---

## Quick Reference

### Common Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Initialize database
psql $POSTGRES_URL < lib/db/schema.sql

# Check database
psql $POSTGRES_URL -c "SELECT COUNT(*) FROM bills;"
```

### Important Files
- `.env.local` - Environment variables (never commit!)
- `lib/db/schema.sql` - Database schema
- `sample-bills.csv` - Test data

### Important URLs
- Local: http://localhost:3000
- Local Admin: http://localhost:3000/admin
- Local Login: http://localhost:3000/admin/login
- Production: https://your-app.vercel.app (after deploy)

---

## Getting Help

### Resources
- See `README.md` for comprehensive documentation
- See `QUICKSTART.md` for fast setup
- See `API_DOCUMENTATION.md` for API details
- Browser console (F12) for JavaScript errors
- Vercel dashboard for deployment logs
- Database client for SQL errors

### Common Issues
- Database connection: Check POSTGRES_URL format
- Login fails: Verify ADMIN_PASSWORD is correct
- Deployment fails: Check environment variables in Vercel
- Bills don't show: Verify database has data

---

## Next Steps After Setup

1. **Verify everything works locally**
2. **Deploy to production**
3. **Set up your actual bills data**
4. **Brief team on how to use admin panel**
5. **Set backup/monitoring schedule**
6. **Monitor for issues in first week**

---

**Setup Status:** ☐ Not Started → ☐ In Progress → ☑️ Complete

**Last Updated:** January 28, 2024

**Estimated Time:** 1-2 hours for complete setup
