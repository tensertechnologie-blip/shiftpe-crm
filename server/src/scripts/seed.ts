import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { config } from '../config/env.js';
import { User, Domain, Setting, Announcement, DirectoryAccess } from '../models/index.js';

export async function runSeed(): Promise<void> {
  console.log('[Seed] Starting ShiftPe Team Portal database seed...');
  await connectDB();

  // 1. Seed Domains
  const defaultDomains = ['Engineering', 'Design', 'Marketing', 'Operations', 'Sales', 'Executive'];
  for (const domainName of defaultDomains) {
    await Domain.findOneAndUpdate(
      { name: domainName },
      { name: domainName, active: true },
      { upsert: true, new: true }
    );
  }
  console.log('[Seed] Initialized standard domains:', defaultDomains);

  // 2. Seed Settings
  await Setting.findOneAndUpdate(
    {},
    {
      lateAfter: '10:15',
      creditScale: { min: 1, max: 5 },
      enabledModules: ['attendance', 'tasks', 'workLogs', 'contributions', 'salary']
    },
    { upsert: true, new: true }
  );
  console.log('[Seed] Initialized default portal settings (lateAfter: 10:15)');

  // 3. Seed CEO Account from environment variables
  const ceoEmail = (config.ceo.email || 'ajay.founder@shiftpe.in').toLowerCase().trim();
  const ceoHash = await bcrypt.hash(config.ceo.password, 10);

  let ceoUser = await User.findOne({ email: ceoEmail });
  if (!ceoUser) {
    ceoUser = await User.create({
      name: config.ceo.name || 'Ajay (Founder & CEO)',
      email: ceoEmail,
      passwordHash: ceoHash,
      role: 'ceo',
      designation: 'Founder & CEO',
      domain: 'Executive',
      reportsTo: null,
      skills: ['Leadership', 'Product Strategy', 'FinTech', 'Operations'],
      phone: config.ceo.phone,
      totpEnabled: false,
      onboardingCompleted: true,
      status: 'active'
    });
    console.log(`[Seed] Created CEO account: ${ceoEmail} (${ceoUser.name})`);
  } else {
    ceoUser.name = config.ceo.name || 'Ajay (Founder & CEO)';
    ceoUser.passwordHash = ceoHash;
    ceoUser.role = 'ceo';
    ceoUser.onboardingCompleted = true;
    await ceoUser.save();
    console.log(`[Seed] Updated existing CEO account: ${ceoEmail}`);
  }

  // 4. Clean up any legacy sample accounts to guarantee data consistency
  const sampleEmails = [
    'sample.alex@shiftpe.com',
    'sample.priya@shiftpe.com',
    'sample.rahul@shiftpe.com',
    'sample.neha@shiftpe.com',
    'sample.david@shiftpe.com'
  ];
  await User.deleteMany({ email: { $in: sampleEmails } });
  await DirectoryAccess.deleteMany({ email: { $in: sampleEmails } });
  console.log('[Seed] Cleaned up legacy sample members for data consistency.');

  // 5. Seed Official Announcements & Legacy Milestones
  const announcementsCount = await Announcement.countDocuments();
  if (announcementsCount === 0) {
    await Announcement.create([
      {
        title: '🚀 ShiftPe Portal v1.0 Production Launch',
        content: 'Welcome everyone to the official ShiftPe Team Workspace! The portal features end-to-end 2FA security, live verified attendance, work logs with CEO credit evaluations, and a 20-week dynamic contribution heatmap. Let’s build the future of localized work together.',
        category: 'milestone',
        author: ceoUser._id,
        authorName: ceoUser.name,
        authorRole: 'ceo',
        pinned: true
      },
      {
        title: '📢 Founding Charter: "Find work. Near you."',
        content: 'Our core mission at ShiftPe is connecting blue-collar, gig, and shift workers across India with transparent, immediate, and dignified work opportunities. Keep customer velocity and radical transparency at the heart of everything we build.',
        category: 'policy',
        author: ceoUser._id,
        authorName: ceoUser.name,
        authorRole: 'ceo',
        pinned: true
      },
      {
        title: '🎉 Q4 2026 Townhall & Product Roadmap',
        content: 'Join us this Friday at 5:00 PM IST for our quarterly all-hands meeting. We will review our product milestones, introduce our new team members, and celebrate the top contributors on the company leaderboard.',
        category: 'townhall',
        author: ceoUser._id,
        authorName: ceoUser.name,
        authorRole: 'ceo',
        pinned: false
      }
    ]);
    console.log('[Seed] Initialized 3 official CEO announcements and founding charter.');
  }

  console.log('\n======================================================');
  console.log('[Seed] Database seed completed successfully!');
  console.log(`CEO Account: ${ceoEmail}`);
  console.log('======================================================\n');

  await disconnectDB();
}

// Auto-run if executed directly via CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Seed script failed:', err);
      process.exit(1);
    });
}
