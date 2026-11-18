import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User, IUser } from '../models/User.js';
import { DirectoryAccess } from '../models/DirectoryAccess.js';

interface CorporateAccountConfig {
  email: string;
  name: string;
  passwordPlainText: string;
  role: 'member' | 'manager' | 'ceo';
  designation: string;
  domain: string;
  skills: string[];
}

export const CORPORATE_ACCOUNTS: CorporateAccountConfig[] = [
  {
    email: 'ajay.founder@shiftpe.in',
    name: 'Ajay',
    passwordPlainText: 'Sar@98112002',
    role: 'ceo',
    designation: 'Founder',
    domain: 'Executive',
    skills: ['Leadership', 'Product Strategy', 'FinTech', 'Operations']
  },
  {
    email: 'ritesh.founder@shiftpe.in',
    name: 'Ritesh',
    passwordPlainText: 'Rit@84912026',
    role: 'ceo',
    designation: 'Co-Founder & Product Lead',
    domain: 'Executive',
    skills: ['Product Management', 'Strategy', 'UI/UX', 'Operations']
  },
  {
    email: 'shubham.yambadwar@shiftpe.in',
    name: 'Shubham Yambadwar',
    passwordPlainText: 'Shu@73192026',
    role: 'manager',
    designation: 'Lead Architect & Engineering',
    domain: 'Engineering',
    skills: ['System Architecture', 'Node.js', 'MongoDB', 'Distributed Systems']
  },
  {
    email: 'prafull.dongre@shiftpe.in',
    name: 'Prafull Dongre',
    passwordPlainText: 'Pra@95242026',
    role: 'manager',
    designation: 'Operations & Growth Lead',
    domain: 'Operations',
    skills: ['Growth Operations', 'Logistics', 'Strategy', 'Vendor Relations']
  },
  {
    email: 'support@shiftpe.in',
    name: 'ShiftPe Support',
    passwordPlainText: 'Sup@61832026',
    role: 'member',
    designation: 'Customer Operations & Support Lead',
    domain: 'Operations',
    skills: ['Customer Experience', 'Ticketing', 'Issue Resolution', 'SLA Management']
  },
  {
    email: 'contact@shiftpe.in',
    name: 'ShiftPe Contact',
    passwordPlainText: 'Con@47292026',
    role: 'member',
    designation: 'Communications & Public Relations',
    domain: 'Marketing',
    skills: ['Corporate Relations', 'Communications', 'Marketing', 'Inquiries']
  },
  {
    email: 'founders@shiftpe.in',
    name: 'ShiftPe Founders Office',
    passwordPlainText: 'Fnd@82052026',
    role: 'ceo',
    designation: 'Founders Office',
    domain: 'Executive',
    skills: ['Executive Strategy', 'Governance', 'Fundraising', 'Operations']
  }
];

export async function setupCorporateAccounts(): Promise<void> {
  console.log('[Corporate Setup] Connecting to database...');
  await connectDB();

  console.log(`[Corporate Setup] Setting up ${CORPORATE_ACCOUNTS.length} corporate accounts...`);

  for (const acc of CORPORATE_ACCOUNTS) {
    const normalizedEmail = acc.email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(acc.passwordPlainText, 10);

    // 1. Ensure DirectoryAccess entry exists and is active
    let dirEntry = await DirectoryAccess.findOne({ email: normalizedEmail });
    if (!dirEntry) {
      dirEntry = await DirectoryAccess.create({
        email: normalizedEmail,
        name: acc.name,
        designation: acc.designation,
        department: acc.domain,
        status: 'active',
        addedByEmail: 'system-setup',
        registered: true
      });
      console.log(`[Corporate Setup] Created DirectoryAccess entry for: ${normalizedEmail}`);
    } else {
      dirEntry.status = 'active';
      dirEntry.registered = true;
      dirEntry.name = acc.name;
      dirEntry.designation = acc.designation;
      dirEntry.department = acc.domain;
      await dirEntry.save();
      console.log(`[Corporate Setup] Updated DirectoryAccess entry for: ${normalizedEmail}`);
    }

    // 2. Find or Create User
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({
        name: acc.name,
        email: normalizedEmail,
        passwordHash,
        role: acc.role,
        designation: acc.designation,
        domain: acc.domain,
        skills: acc.skills,
        phone: '',
        status: 'active',
        onboardingCompleted: true,
        onboardingSkipped: false,
        isTemporaryPassword: false,
        failedAttempts: 0,
        lockUntil: undefined
      });
      console.log(`[Corporate Setup] Successfully created user: ${acc.name} (${normalizedEmail})`);
    } else {
      user.name = acc.name;
      user.passwordHash = passwordHash;
      user.role = acc.role;
      user.designation = acc.designation;
      user.domain = acc.domain;
      if (acc.skills.length > 0 && (!user.skills || user.skills.length === 0)) {
        user.skills = acc.skills;
      }
      user.status = 'active';
      user.onboardingCompleted = true;
      user.isTemporaryPassword = false;
      user.failedAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
      console.log(`[Corporate Setup] Successfully updated password and credentials for: ${acc.name} (${normalizedEmail})`);
    }

    dirEntry.registeredUserId = user._id;
    await dirEntry.save();
  }

  console.log('\n[Corporate Setup] All 7 accounts configured and ready for login!');
  await disconnectDB();
}

if (process.argv[1]?.endsWith('setupCorporateAccounts.ts') || process.argv[1]?.endsWith('setupCorporateAccounts.js')) {
  setupCorporateAccounts()
    .then(() => {
      console.log('[Corporate Setup] Script finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Corporate Setup] Script failed:', err);
      process.exit(1);
    });
}
