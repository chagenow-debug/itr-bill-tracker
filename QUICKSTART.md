# Quick Start Guide

## Prerequisites
- Node.js 18+ and npm
- A PostgreSQL database (Vercel Postgres or Supabase)
- GitHub account (for Vercel deployment)

## Steps

### 1. Clone/Set Up Repository

```bash
cd itr-bill-tracker
npm install
```

### 2. Set Environment Variables

Create `.env.local`:

```
POSTGRES_URL="postgresql://user:password@host:5432/database"
ADMIN_PASSWORD="your-secure-password"
```

### 3. Initialize Database

Run the schema SQL:

```bash
# Using psql directly
psql $POSTGRES_URL < lib/db/schema.sql

# Or paste the contents of lib/db/schema.sql into your database client
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Test the Admin Panel

1. Go to `http://localhost:3000/admin/login`
2. Enter the password you set in `ADMIN_PASSWORD`
3. You should see the admin dashboard

### 6. Add Sample Bills

Option A: Manual Entry
- Click "Add New Bill"
- Fill in the form
- Click "Create Bill"

Option B: CSV Import
- Go to "Import CSV"
- Upload `sample-bills.csv` included in the project
- Click "Import Bills"

### 7. View Bills

Go to `http://localhost:3000` to see your bills displayed publicly

## Deploying to Vercel

### One-Time Setup

1. Push your code to GitHub
2. Go to https://vercel.com and connect your GitHub account
3. Import the project

### Configure Environment Variables

In Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add:
   - `POSTGRES_URL` = your database connection string
   - `ADMIN_PASSWORD` = your secure password

### Deploy

```bash
# Automatic on push to main
git push
```

Or manually:

```bash
npm install -g vercel
vercel deploy --prod
```

## Default Features

✅ Public bill listing
✅ Position filtering (Support/Against/Monitor/Undecided)
✅ Password-protected admin
✅ Add/edit/delete bills
✅ CSV bulk import
✅ Responsive design
✅ Database persistence

## Next Steps

- Update the bill data with your actual bills
- Customize branding/colors in `app/page.tsx` and `app/admin/page.tsx`
- Set a stronger admin password
- Consider adding more admin features (user accounts, history, etc.)

## Troubleshooting

**"Cannot find module '@vercel/postgres'"**
```bash
npm install @vercel/postgres
```

**Database connection error**
- Verify `POSTGRES_URL` is correct
- Ensure database is running and accessible
- Check firewall/network settings

**Admin login always fails**
- Double-check `ADMIN_PASSWORD` in `.env.local` matches what you entered
- Try clearing browser cookies
- Restart development server

## API Examples

```bash
# Get all bills
curl http://localhost:3000/api/bills

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your-password"}'

# Add a bill (requires auth)
curl -X POST http://localhost:3000/api/bills \
  -H "Content-Type: application/json" \
  -d '{
    "bill_number": "HF 123",
    "chamber": "House",
    "title": "Example Bill",
    "short_title": "Example",
    "position": "Support"
  }'
```

## File Structure

```
itr-bill-tracker/
├── app/
│   ├── api/              # API endpoints
│   │   ├── auth/         # Login/logout
│   │   └── bills/        # Bill CRUD + import
│   ├── admin/            # Admin panel pages
│   ├── page.tsx          # Public bill listing
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── lib/
│   ├── auth.ts           # Authentication logic
│   └── db/
│       ├── client.ts     # Database queries
│       └── schema.sql    # Database schema
├── public/               # Static files
└── package.json          # Dependencies
```

## Security Notes

- Passwords are checked against `ADMIN_PASSWORD` environment variable
- Use strong passwords (20+ characters recommended)
- Store `ADMIN_PASSWORD` in Vercel secrets, not in code
- Sessions are HTTP-only cookies
- Consider implementing rate limiting for production
