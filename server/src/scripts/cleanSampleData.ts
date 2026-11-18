import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { DirectoryAccess } from '../models/DirectoryAccess.js';
import { Attendance } from '../models/Attendance.js';
import { WorkLog } from '../models/WorkLog.js';

export async function cleanSampleData(): Promise<void> {
  console.log('[CleanData] Connecting to database...');
  await connectDB();

  console.log('[CleanData] Identifying sample and test accounts...');
  const sampleUsers = await User.find({
    $or: [
      { email: { $regex: /^sample\..*@shiftpe\.com$/i } },
      { name: { $regex: /^Sample\s+/i } }
    ]
  });

  const sampleUserIds = sampleUsers.map((u) => u._id);
  const sampleEmails = sampleUsers.map((u) => u.email.toLowerCase());

  console.log(`[CleanData] Found ${sampleUsers.length} sample accounts to purge:`, sampleEmails);

  if (sampleUserIds.length > 0) {
    // 1. Unlink any users reporting to these sample accounts
    const unlinked = await User.updateMany(
      { reportsTo: { $in: sampleUserIds } },
      { $set: { reportsTo: null } }
    );
    console.log(`[CleanData] Reset reportsTo for ${unlinked.modifiedCount} accounts.`);

    // 2. Remove associated attendance
    const deletedAttendance = await Attendance.deleteMany({ userId: { $in: sampleUserIds } });
    console.log(`[CleanData] Deleted ${deletedAttendance.deletedCount} attendance records.`);

    // 3. Remove associated work logs
    const deletedWork = await WorkLog.deleteMany({ userId: { $in: sampleUserIds } });
    console.log(`[CleanData] Deleted ${deletedWork.deletedCount} work log records.`);

    // 4. Delete the sample users
    const deletedUsers = await User.deleteMany({ _id: { $in: sampleUserIds } });
    console.log(`[CleanData] Deleted ${deletedUsers.deletedCount} sample users.`);
  }

  // 5. Delete sample directory access entries
  const deletedDir = await DirectoryAccess.deleteMany({
    email: { $regex: /^sample\..*@shiftpe\.com$/i }
  });
  console.log(`[CleanData] Deleted ${deletedDir.deletedCount} sample DirectoryAccess entries.`);

  const remainingUsers = await User.find({ status: 'active' }).select('name email role designation');
  console.log(`\n[CleanData] Remaining clean active team accounts (${remainingUsers.length}):`);
  remainingUsers.forEach((u) => {
    console.log(` - ${u.name} <${u.email}> [${u.role.toUpperCase()}] (${u.designation})`);
  });

  await disconnectDB();
  console.log('[CleanData] Cleanup completed successfully!');
}

if (process.argv[1]?.endsWith('cleanSampleData.ts') || process.argv[1]?.endsWith('cleanSampleData.js')) {
  cleanSampleData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[CleanData] Script error:', err);
      process.exit(1);
    });
}
