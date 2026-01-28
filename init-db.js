const { sql } = require('@vercel/postgres');
const fs = require('fs');

async function initializeDatabase() {
  try {
    const schemaSQL = fs.readFileSync('./lib/db/schema.sql', 'utf-8');

    // Split by semicolon and filter empty statements
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log('Found ' + statements.length + ' SQL statements to execute');

    for (const statement of statements) {
      console.log('Executing: ' + statement.substring(0, 60) + '...');
      await sql.query(statement);
    }

    console.log('\nDatabase schema initialized successfully!');

    // Verify tables were created
    const result = await sql.query('SELECT table_name FROM information_schema.tables WHERE table_schema=\'public\'');
    console.log('\nTables created:');
    result.rows.forEach(row => console.log('  - ' + row.table_name));

    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
