import { DirectoryAccess } from '../models/DirectoryAccess.js';

/**
 * ShiftPe Official Corporate Email Directory Whitelist
 * Seed emails permanently authorized for founders & initial team.
 */
export const AUTHORIZED_SHIFTPE_EMAILS = [
  'ajay.founder@shiftpe.in',
  'ritesh.founder@shiftpe.in',
  'shubham.yambadwar@shiftpe.in',
  'prafull.dongre@shiftpe.in',
  'support@shiftpe.in',
  'contact@shiftpe.in',
  'founders@shiftpe.in'
];

/**
 * Checks whether an email is permitted to register or sign in.
 * Evaluates dynamic CEO/Founder directory permissions from database,
 * falling back to initial corporate seeds.
 */
export async function isEmailWhitelisted(email: string): Promise<boolean> {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();

  try {
    const entry = await DirectoryAccess.findOne({ email: normalized });
    if (entry) {
      return entry.status === 'active';
    }
  } catch (err) {
    // If DB is offline or buffering, fall through to hardcoded seeds
  }

  // Official production directory seed
  if (AUTHORIZED_SHIFTPE_EMAILS.includes(normalized)) {
    return true;
  }

  // Sample & test accounts for sandbox/local dev/test verification
  if (process.env.NODE_ENV !== 'production') {
    if (normalized.startsWith('test.') && /@shiftpe\.(com|in)$/i.test(normalized)) {
      return true;
    }

    const devSampleEmails = [
      'sample.alex@shiftpe.com',
      'sample.priya@shiftpe.com',
      'sample.rahul@shiftpe.com',
      'sample.neha@shiftpe.com',
      'sample.david@shiftpe.com'
    ];
    if (devSampleEmails.includes(normalized)) {
      return true;
    }
  }

  return false;
}
