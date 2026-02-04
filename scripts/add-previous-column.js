#!/usr/bin/env node

const pg = require('pg');
const { Client } = pg;

async function addPreviousColumn() {
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

    // Check if column already exists
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='bills' AND column_name='previous_bill_number'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✓ Column previous_bill_number already exists');
      process.exit(0);
    }

    // Add the column
    console.log('Adding previous_bill_number column...');
    await client.query(`
      ALTER TABLE bills
      ADD COLUMN previous_bill_number VARCHAR(255)
    `);

    console.log('✓ Successfully added previous_bill_number column');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addPreviousColumn();
