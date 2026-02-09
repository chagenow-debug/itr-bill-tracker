import { query } from '@/lib/db/client';

export async function GET() {
  try {
    console.log('[MIGRATE] Starting manager column migration...');

    // Add manager column if it doesn't exist
    await query(
      'ALTER TABLE bills ADD COLUMN IF NOT EXISTS manager VARCHAR(255) DEFAULT NULL'
    );

    console.log('[MIGRATE] Manager column added successfully');

    return Response.json({
      success: true,
      message: 'Manager column added to bills table'
    });
  } catch (error) {
    console.error('[MIGRATE] Error:', error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
