import { query } from '@/lib/db/client';

export async function GET() {
  try {
    console.log('[MIGRATE] Starting is_funnel column migration...');

    // Add is_funnel column if it doesn't exist
    await query(
      'ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_funnel BOOLEAN DEFAULT FALSE'
    );

    console.log('[MIGRATE] is_funnel column added successfully');

    return Response.json({
      success: true,
      message: 'is_funnel column added to bills table'
    });
  } catch (error) {
    console.error('[MIGRATE] Error:', error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
