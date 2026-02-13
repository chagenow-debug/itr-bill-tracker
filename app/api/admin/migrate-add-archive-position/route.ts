import { query } from '@/lib/db/client';

export async function GET() {
  try {
    console.log('[MIGRATE] Starting archive position migration...');

    // Drop the old check constraint and add a new one that includes 'Archive'
    // PostgreSQL requires dropping the constraint first, then adding a new one
    await query(
      `ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_position_check`
    );

    // Add the new constraint with Archive option
    await query(
      `ALTER TABLE bills ADD CONSTRAINT bills_position_check CHECK (position IN ('Support', 'Against', 'Monitor', 'Undecided', 'Archive'))`
    );

    console.log('[MIGRATE] Archive position added successfully');

    return Response.json({
      success: true,
      message: 'Archive position option added to bills table'
    });
  } catch (error) {
    console.error('[MIGRATE] Error:', error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
