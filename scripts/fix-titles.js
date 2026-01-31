#!/usr/bin/env node

const pg = require('pg');
const { Client } = pg;

async function fixTitles() {
  const connectionString = process.env.DATABASE_URL ||
                          process.env.POSTGRES_PRISMA_URL ||
                          process.env.DATABASE_PRISMA_DATABASE_URL;

  if (!connectionString) {
    console.error('Error: No database connection string found');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    console.log('Fetching all bills...');
    const result = await client.query('SELECT id, short_title FROM bills');
    const bills = result.rows;
    console.log(`Found ${bills.length} bills`);

    let updated = 0;

    for (const bill of bills) {
      const newTitle = bill.short_title.charAt(0).toUpperCase() + bill.short_title.slice(1).toLowerCase();

      if (newTitle !== bill.short_title) {
        console.log(`Updating bill ${bill.id}: "${bill.short_title}" -> "${newTitle}"`);
        await client.query(
          'UPDATE bills SET short_title = $1, updated_at = NOW() WHERE id = $2',
          [newTitle, bill.id]
        );
        updated++;
      }
    }

    console.log(`\n✓ Successfully updated ${updated} bill titles`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixTitles();
