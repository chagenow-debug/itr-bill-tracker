// Quick test to validate connection strings
const connectionStrings = {
  'DATABASE_PRISMA_DATABASE_URL': process.env.DATABASE_PRISMA_DATABASE_URL,
  'DATABASE_PRISMA_URL': process.env.DATABASE_PRISMA_URL,
  'DATABASE_URL': process.env.DATABASE_URL,
  'POSTGRES_PRISMA_URL': process.env.POSTGRES_PRISMA_URL,
  'POSTGRES_URL': process.env.POSTGRES_URL,
};

console.log('Available connection strings:');
Object.entries(connectionStrings).forEach(([name, value]) => {
  if (value) {
    const hidden = value.replace(/(?<=:)[^:]*(?=@)/, '****').substring(0, 80);
    console.log(`  ${name}: ${hidden}...`);
  } else {
    console.log(`  ${name}: NOT SET`);
  }
});
