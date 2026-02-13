import { query } from '@/lib/db/client';

export async function GET() {
  try {
    console.log('[MIGRATE] Starting is_archived column migration...');

    // Add is_archived column if it doesn't exist
    await query(
      'ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE'
    );

    console.log('[MIGRATE] is_archived column added successfully');

    return Response.json({
      success: true,
      message: 'is_archived column added to bills table'
    });
  } catch (error) {
    console.error('[MIGRATE] Error:', error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
