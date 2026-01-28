# ITR Bill Tracker

A Next.js-based bill tracking system for Iowans for Tax Relief to manage Iowa General Assembly bills and positions.

## Features

- **Public Bill Display**: View all tracked bills with positions (Support/Against/Monitor/Undecided)
- **Password-Protected Admin Panel**: Manage bills with simple authentication
- **Add/Edit/Delete Bills**: Full CRUD operations for individual bills
- **Bulk Import**: CSV import tool for adding multiple bills at once
- **Responsive Design**: Works on desktop and mobile devices
- **PostgreSQL Database**: Persistent storage for all bill data

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL
- **Database**: Vercel Postgres or Supabase
- **Deployment**: Vercel

## Setup Instructions

### 1. Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your settings

# Run development server
npm run dev
```

Visit `http://localhost:3000` to view the app.

### 2. Database Setup

#### Option A: Vercel Postgres (Recommended)

1. Create a Vercel project
2. Add Vercel Postgres storage
3. Get the `POSTGRES_URL` from the storage credentials
4. Add to `.env.local`

#### Option B: Supabase

1. Create a Supabase project
2. Copy the connection string
3. Add as `POSTGRES_URL` in `.env.local`

### 3. Initialize Database Schema

```bash
# Run the SQL schema to create tables
psql $POSTGRES_URL < lib/db/schema.sql
```

Or manually execute the SQL in `lib/db/schema.sql` through your database client.

### 4. Configure Admin Password

Edit `.env.local` and set a strong password:

```
ADMIN_PASSWORD=your-secure-password-here
```

### 5. Deploy to Vercel

```bash
# Push to GitHub first
git push

# Deploy to Vercel
vercel deploy
```

Configure environment variables in Vercel dashboard:
- `POSTGRES_URL`
- `ADMIN_PASSWORD`

## Usage

### Public Site
- Visit `/` to view all bills
- Filter by position (Support, Against, Monitor, Undecided)
- View bill details and links to legislature.iowa.gov

### Admin Panel
- Visit `/admin/login` to access admin area
- Login with admin password
- **Add Bills**: Click "Add New Bill" and fill out form
- **Edit Bills**: Click "Edit" on any bill in the table
- **Delete Bills**: Click "Delete" and confirm
- **Import CSV**: Click "Import CSV" to bulk upload

## CSV Import Format

Create a CSV file with these headers (all optional except marked):

```
bill_number*,companion_bills,chamber*,title*,short_title*,description,committee,committee_key,status,position*,sponsor,subcommittee,fiscal_note,lsb,url,notes
```

**Required fields:** `bill_number`, `chamber`, `title`, `short_title`, `position`

**Position values:** `Support`, `Against`, `Monitor`, `Undecided`

**Chambers:** `House`, `Senate`

Example:
```csv
bill_number,chamber,title,short_title,position,sponsor
HF 123,House,An Act relating to income tax,Income Tax Cut,Support,John Smith
SF 456,Senate,An Act relating to education,Education Funding,Monitor,Jane Doe
```

## API Endpoints

### Public
- `GET /api/bills` - List all bills

### Admin (Requires Authentication)
- `GET /api/bills/:id` - Get single bill
- `POST /api/bills` - Create bill
- `PUT /api/bills/:id` - Update bill
- `DELETE /api/bills/:id` - Delete bill
- `POST /api/bills/import` - Bulk import from CSV
- `POST /api/auth/login` - Login with password
- `POST /api/auth/logout` - Logout

## Database Schema

### bills table
- `id` (primary key)
- `bill_number` (unique, e.g., "HF 123")
- `companion_bills` (related bills)
- `chamber` (House/Senate)
- `title` (full title)
- `short_title` (concise title)
- `description` (detailed description)
- `committee` (assigned committee)
- `committee_key` (committee abbreviation)
- `status` (current status)
- `position` (Support/Against/Monitor/Undecided)
- `sponsor` (bill sponsor)
- `subcommittee` (if applicable)
- `fiscal_note` (boolean)
- `lsb` (Legislative Services Bureau ID)
- `url` (link to bill)
- `notes` (internal notes)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### admin_logs table
- `id` (primary key)
- `action` (action performed)
- `bill_id` (related bill)
- `changes` (JSONB of changes)
- `created_at` (timestamp)

## Development Notes

- The admin session is stored as an HTTP-only cookie
- Session duration is 24 hours
- Passwords are checked directly against `ADMIN_PASSWORD` env var
- The import endpoint validates all data before inserting
- Duplicate bill numbers are rejected on import
- All timestamps are in UTC

## Future Enhancements

- User account system (instead of single password)
- Bill history/version tracking
- Advanced audit logs
- Email notifications for bill status changes
- Integration with legislature.iowa.gov API
- Multi-admin support with roles

## Troubleshooting

### Database Connection Issues
- Verify `POSTGRES_URL` is correct
- Check database is accessible from Vercel IP ranges
- Ensure schema has been initialized

### Import Failures
- Validate CSV format matches required columns
- Check for duplicate bill numbers
- Verify position values are exact (case-sensitive)

### Admin Panel Not Loading
- Ensure you're logged in
- Check browser cookies are enabled
- Try clearing cookies and logging in again

## License

Internal use for Iowans for Tax Relief
