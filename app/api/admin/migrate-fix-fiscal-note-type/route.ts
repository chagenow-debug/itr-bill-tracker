import { query } from '@/lib/db/client';

export async function GET() {
  try {
    console.log('[MIGRATE] Starting fiscal_note column type migration...');

    // Drop the old BOOLEAN column and recreate as TEXT
    // First, drop the column
    await query(
      'ALTER TABLE bills DROP COLUMN IF EXISTS fiscal_note'
    );

    // Then add it back as TEXT
    await query(
      'ALTER TABLE bills ADD COLUMN fiscal_note TEXT'
    );

    console.log('[MIGRATE] fiscal_note column recreated as TEXT');

    return Response.json({
      success: true,
      message: 'fiscal_note column dropped and recreated as TEXT for URL storage'
    });
  } catch (error) {
    console.error('[MIGRATE] Error:', error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
