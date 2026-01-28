# API Documentation

Complete reference for all ITR Bill Tracker API endpoints.

## Base URL

- **Local**: `http://localhost:3000`
- **Production**: `https://your-domain.vercel.app`

## Public Endpoints

### List All Bills

**GET** `/api/bills`

Returns all bills in the database.

**Response:**
```json
[
  {
    "id": 1,
    "bill_number": "HF 123",
    "companion_bills": "SF 456",
    "chamber": "House",
    "title": "An Act relating to income tax",
    "short_title": "Income Tax Reduction",
    "description": "Reduces income tax rate from 5.7% to 4.5%",
    "committee": "Ways and Means",
    "committee_key": "WAYS",
    "status": "Assigned",
    "position": "Support",
    "sponsor": "John Smith",
    "subcommittee": null,
    "fiscal_note": true,
    "lsb": "LSB-1001",
    "url": "https://legis.iowa.gov/bills/HF123",
    "notes": "Priority bill",
    "created_at": "2024-01-28T12:00:00Z",
    "updated_at": "2024-01-28T12:00:00Z"
  }
]
```

**Status Codes:**
- `200 OK` - Successfully retrieved bills
- `500 Internal Server Error` - Database error

---

## Authentication Endpoints

### Login

**POST** `/api/auth/login`

Authenticate with admin password. Creates session cookie.

**Request Body:**
```json
{
  "password": "your-admin-password"
}
```

**Response (Success):**
```json
{
  "message": "Authenticated successfully"
}
```

**Response (Failure):**
```json
{
  "error": "Invalid password"
}
```

**Status Codes:**
- `200 OK` - Login successful
- `400 Bad Request` - Missing password
- `401 Unauthorized` - Invalid password
- `500 Internal Server Error` - Server error

**Cookies Set:**
- `admin_session` - HTTP-only session cookie (24 hour expiry)

---

### Logout

**POST** `/api/auth/logout`

Clear admin session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Status Codes:**
- `200 OK` - Logout successful
- `500 Internal Server Error` - Server error

---

## Protected Bill Endpoints

> **Authentication Required**: All endpoints below require an active `admin_session` cookie obtained from `/api/auth/login`

### Get Single Bill

**GET** `/api/bills/:id`

Get details of a specific bill by ID.

**Parameters:**
- `id` (path) - Bill ID (integer)

**Response:**
```json
{
  "id": 1,
  "bill_number": "HF 123",
  "chamber": "House",
  "title": "An Act relating to income tax",
  "short_title": "Income Tax Reduction",
  "position": "Support",
  ...
}
```

**Status Codes:**
- `200 OK` - Bill found
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Bill doesn't exist
- `500 Internal Server Error` - Database error

---

### Create Bill

**POST** `/api/bills`

Create a new bill.

**Request Body:**
```json
{
  "bill_number": "HF 999",
  "companion_bills": "SF 888",
  "chamber": "House",
  "title": "An Act relating to...",
  "short_title": "Short Title",
  "description": "Detailed description",
  "committee": "Committee Name",
  "committee_key": "CM",
  "status": "Assigned",
  "position": "Support",
  "sponsor": "Sponsor Name",
  "subcommittee": "Sub Committee",
  "fiscal_note": false,
  "lsb": "LSB-9999",
  "url": "https://legis.iowa.gov/bills/HF999",
  "notes": "Internal notes"
}
```

**Required Fields:**
- `bill_number` - Unique bill identifier
- `chamber` - "House" or "Senate"
- `title` - Full bill title
- `short_title` - Abbreviated title
- `position` - "Support", "Against", "Monitor", or "Undecided"

**Optional Fields:**
- All others (will be null if not provided)

**Response:**
```json
{
  "id": 999,
  "bill_number": "HF 999",
  "created_at": "2024-01-28T13:00:00Z",
  "updated_at": "2024-01-28T13:00:00Z",
  ...
}
```

**Status Codes:**
- `201 Created` - Bill created successfully
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Database error (may be duplicate bill_number)

---

### Update Bill

**PUT** `/api/bills/:id`

Update an existing bill. Only include fields you want to change.

**Parameters:**
- `id` (path) - Bill ID to update

**Request Body (all fields optional):**
```json
{
  "position": "Against",
  "status": "Passed",
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "id": 1,
  "bill_number": "HF 123",
  "position": "Against",
  "status": "Passed",
  "notes": "Updated notes",
  "updated_at": "2024-01-28T14:00:00Z",
  ...
}
```

**Status Codes:**
- `200 OK` - Bill updated successfully
- `400 Bad Request` - No fields to update
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Bill doesn't exist
- `500 Internal Server Error` - Database error

---

### Delete Bill

**DELETE** `/api/bills/:id`

Delete a bill permanently.

**Parameters:**
- `id` (path) - Bill ID to delete

**Response:**
```json
{
  "message": "Bill deleted successfully"
}
```

**Status Codes:**
- `200 OK` - Bill deleted successfully
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Bill doesn't exist
- `500 Internal Server Error` - Database error

---

## Bulk Import Endpoint

### Import Bills from CSV

**POST** `/api/bills/import`

Upload a CSV file to bulk create/update bills.

**Parameters:**
- `file` (form-data) - CSV file upload

**CSV Format:**
```
bill_number,companion_bills,chamber,title,short_title,description,committee,committee_key,status,position,sponsor,subcommittee,fiscal_note,lsb,url,notes
HF 123,SF 456,House,Full Title,Short Title,Description,Committee,CM,Status,Support,Sponsor,Sub,true,LSB-1001,https://...,Notes
```

**Required CSV Columns:**
- `bill_number`
- `chamber`
- `title`
- `short_title`
- `position`

**Optional CSV Columns:**
- All others

**Response (Success):**
```json
{
  "message": "Imported 5 bills",
  "imported": [
    {
      "id": 100,
      "bill_number": "HF 123",
      ...
    }
  ],
  "errors": [
    "Bill HF 999: Already exists in database"
  ],
  "skipped": 1
}
```

**Response (Validation Error):**
```json
{
  "error": "No valid bills found in CSV",
  "details": [
    "Row 2: Missing required fields (bill_number, chamber, title, short_title, position)",
    "Row 3: Invalid position value. Must be: Support, Against, Monitor, or Undecided"
  ]
}
```

**Status Codes:**
- `200 OK` - Import completed (check errors array for issues)
- `400 Bad Request` - Invalid CSV format or no valid bills
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

**Notes:**
- Duplicate `bill_number` values are rejected (constraint violation)
- Position values are case-sensitive: "Support", "Against", "Monitor", "Undecided"
- Chamber values: "House" or "Senate"
- `fiscal_note` should be "true"/"false" or "1"/"0" in CSV
- Rows with errors are skipped but import continues
- All valid rows are inserted even if some fail

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common error codes:

| Status | Meaning |
|--------|---------|
| 400 | Bad Request - Invalid input or missing required fields |
| 401 | Unauthorized - Not authenticated or session expired |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Database or server issue |

---

## Pagination & Filtering

Currently not implemented but can be added. The `/api/bills` endpoint returns all bills. For large datasets, consider:

```typescript
// Future enhancement example
GET /api/bills?page=1&limit=50&position=Support&chamber=House&sort=created_at
```

---

## Rate Limiting

Not currently implemented. Consider adding for production:
- 100 requests per minute per IP
- 10 uploads per minute per session
- 1000 requests per hour per IP

---

## Example Usage

### cURL

```bash
# Get all bills
curl http://localhost:3000/api/bills

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your-password"}' \
  -c cookies.txt

# Get single bill (with auth)
curl http://localhost:3000/api/bills/1 \
  -b cookies.txt

# Create bill (with auth)
curl -X POST http://localhost:3000/api/bills \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "bill_number": "HF 999",
    "chamber": "House",
    "title": "Example Bill",
    "short_title": "Example",
    "position": "Support"
  }'

# Update bill (with auth)
curl -X PUT http://localhost:3000/api/bills/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"position":"Against"}'

# Delete bill (with auth)
curl -X DELETE http://localhost:3000/api/bills/1 \
  -b cookies.txt

# Import CSV (with auth)
curl -X POST http://localhost:3000/api/bills/import \
  -b cookies.txt \
  -F "file=@bills.csv"

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

### JavaScript/Fetch

```javascript
// Login and get session
const loginRes = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'your-password' }),
  credentials: 'include' // Important: include cookies
});

// Get bills (public)
const billsRes = await fetch('/api/bills');
const bills = await billsRes.json();

// Create bill (authenticated)
const createRes = await fetch('/api/bills', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bill_number: 'HF 999',
    chamber: 'House',
    title: 'Example',
    short_title: 'Example',
    position: 'Support'
  }),
  credentials: 'include'
});

// Import CSV
const formData = new FormData();
formData.append('file', csvFile);
const importRes = await fetch('/api/bills/import', {
  method: 'POST',
  body: formData,
  credentials: 'include'
});
```

---

## Validation Rules

### bill_number
- Required, unique
- Format: Up to 20 characters (e.g., "HF 123", "SF 456")

### chamber
- Required
- Allowed values: "House", "Senate"

### title
- Required
- Text field (no length limit in schema)

### short_title
- Required
- Up to 255 characters

### position
- Required
- Allowed values: "Support", "Against", "Monitor", "Undecided"

### fiscal_note
- Optional
- Boolean (true/false or 1/0 in CSV)

### All other fields
- Optional
- Text fields with reasonable length limits

---

## Rate Limiting (Future)

Consider implementing:
- 100 API calls per minute per IP
- 10 bulk imports per minute per session
- Exponential backoff for repeated failures

---

## Versioning

API is currently v1 (no versioning). For future versions, consider:
- `/api/v1/bills`
- `/api/v2/bills` (if breaking changes)

---

## Support

For API issues:
1. Check error message in response
2. Verify authentication (check cookies)
3. Validate request format
4. Check database connection
5. Review logs in browser console or server
