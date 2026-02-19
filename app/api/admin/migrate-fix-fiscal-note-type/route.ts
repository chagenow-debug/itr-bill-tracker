import { query } from '@/lib/db/client';

export async function GET() {
  try {
    console.log('[MIGRATE] Starting fiscal_note column type migration...');

    // Change fiscal_note from BOOLEAN to TEXT to store URLs
    await query(
      'ALTER TABLE bills ALTER COLUMN fiscal_note TYPE TEXT'
    );

    console.log('[MIGRATE] fiscal_note column type changed from BOOLEAN to TEXT');

    return Response.json({
      success: true,
      message: 'fiscal_note column type changed from BOOLEAN to TEXT'
    });
  } catch (error) {
    console.error('[MIGRATE] Error:', error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
