const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!\n');

    const schemaPath = path.join(__dirname, 'lib', 'db', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

    // Parse statements more carefully
    const statements = [];
    let current = '';

    for (const line of schemaSQL.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('--')) continue;
      if (trimmed === '') {
        if (current.trim()) statements.push(current.trim());
        current = '';
      } else {
        current += ' ' + trimmed;
        if (trimmed.endsWith(';')) {
          statements.push(current.trim());
          current = '';
        }
      }
    }
    if (current.trim()) statements.push(current.trim());

    console.log('Found ' + statements.length + ' SQL statements to execute\n');

    for (const statement of statements) {
      if (!statement) continue;
      const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
      console.log('Executing: ' + preview + '...');
      try {
        await client.query(statement);
        console.log('✓ Success\n');
      } catch (err) {
        console.log('  Error: ' + err.message + '\n');
      }
    }

    console.log('✅ Database schema initialization complete!');

    // Verify tables were created
    const result = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );

    if (result.rows.length > 0) {
      console.log('\nTables created:');
      result.rows.forEach(row => console.log('  ✓ ' + row.table_name));
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
}

initializeDatabase();
