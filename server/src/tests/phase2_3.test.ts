import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { Attendance } from '../models/Attendance.js';
import { WorkLog } from '../models/WorkLog.js';
import { config } from '../config/env.js';

describe('Phase 2 & Phase 3 Test Suite: People Hierarchy, Org Tree, Attendance & Work Approvals', () => {
  let app: ReturnType<typeof createApp>;

  let ceoUser: any;
  let managerUser: any;
  let memberUser: any;

  let ceoToken: string;
  let memberToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await mongoose.connect(config.mongoUri);
    }
    app = createApp();
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({
      email: { $in: ['test_ceo2@shiftpe.com', 'test_manager2@shiftpe.com', 'test_member2@shiftpe.com'] }
    });
    if (ceoUser) await Attendance.deleteMany({ userId: { $in: [ceoUser._id, memberUser._id] } });
    if (ceoUser) await WorkLog.deleteMany({ userId: { $in: [ceoUser._id, memberUser._id] } });
  });

  beforeEach(async () => {
    await User.deleteMany({
      email: { $in: ['test_ceo2@shiftpe.com', 'test_manager2@shiftpe.com', 'test_member2@shiftpe.com'] }
    });

    const hash = await bcrypt.hash('Password123!', 10);

    // 1. CEO
    ceoUser = await User.create({
      name: 'CEO Ajay',
      email: 'test_ceo2@shiftpe.com',
      passwordHash: hash,
      role: 'ceo',
      designation: 'Founder & CEO',
      domain: 'Executive',
      status: 'active',
      totpEnabled: true
    });

    // 2. Manager reporting to CEO
    managerUser = await User.create({
      name: 'Manager Neha',
      email: 'test_manager2@shiftpe.com',
      passwordHash: hash,
      role: 'manager',
      designation: 'Operations Lead',
      domain: 'Operations',
      reportsTo: ceoUser._id,
      status: 'active',
      totpEnabled: true
    });

    // 3. Member reporting to Manager
    memberUser = await User.create({
      name: 'Member Alex',
      email: 'test_member2@shiftpe.com',
      passwordHash: hash,
      role: 'member',
      designation: 'Frontend Engineer',
      domain: 'Engineering',
      reportsTo: managerUser._id,
      status: 'active',
      totpEnabled: true
    });

    ceoToken = jwt.sign(
      { userId: ceoUser._id.toString(), email: ceoUser.email, role: 'ceo', name: ceoUser.name },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    memberToken = jwt.sign(
      { userId: memberUser._id.toString(), email: memberUser.email, role: 'member', name: memberUser.name },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    await Attendance.deleteMany({ userId: { $in: [ceoUser._id, memberUser._id] } });
    await WorkLog.deleteMany({ userId: { $in: [ceoUser._id, memberUser._id] } });
  });

  // --- Phase 2 Tests ---

  test('P2.1: Blocks circular reporting cycle (manager cannot report to subordinate member)', async () => {
    // Attempting to make managerUser report to memberUser (who reports to managerUser)
    const res = await request(app)
      .patch(`/api/users/${managerUser._id}`)
      .set('Authorization', `Bearer ${ceoToken}`)
      .send({ reportsTo: memberUser._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/circular reporting relationship was detected/i);
  });

  test('P2.2: Members can ONLY edit their own phone and skills, not designation or role', async () => {
    const res = await request(app)
      .patch(`/api/users/${memberUser._id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        phone: '+91 9999900000',
        skills: ['React', 'TypeScript', 'Jest'],
        designation: 'Hacked Vice President',
        role: 'ceo'
      });

    expect(res.status).toBe(200);

    const updated = await User.findById(memberUser._id);
    expect(updated?.phone).toBe('+91 9999900000');
    expect(updated?.skills).toEqual(['React', 'TypeScript', 'Jest']);
    // Designation and role must NOT have changed
    expect(updated?.designation).toBe('Frontend Engineer');
    expect(updated?.role).toBe('member');
  });

  test('P2.3: Correctly fetches user profile with chain to CEO and direct reports', async () => {
    const res = await request(app)
      .get(`/api/users/${memberUser._id}/profile`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.chainToCeo).toHaveLength(2); // Manager Neha -> CEO Ajay
    expect(res.body.chainToCeo[0].name).toBe('Manager Neha');
    expect(res.body.chainToCeo[1].name).toBe('CEO Ajay');
  });

  // --- Phase 3 Tests ---

  test('P3.1: Check in and out using SERVER timestamp (only one record per day)', async () => {
    // Check in
    const checkInRes = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ workMode: 'office' });

    expect(checkInRes.status).toBe(201);
    expect(checkInRes.body.attendance.status).toBe('pending');
    expect(checkInRes.body.attendance.checkIn).toBeDefined();

    // Duplicate check in rejected
    const dupRes = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({});
    expect(dupRes.status).toBe(400);

    // Check out
    const checkOutRes = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(checkOutRes.status).toBe(200);
    expect(checkOutRes.body.attendance.checkOut).toBeDefined();
  });

  test('P3.2: Member cannot set credits on work submission', async () => {
    const res = await request(app)
      .post('/api/work')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Built Auth System',
        description: 'Implemented 2FA and Helmet headers',
        hours: 6,
        link: 'https://github.com/shiftpe/pull/12',
        credits: 5 // Malicious attempt to self-assign 5 credits
      });

    expect(res.status).toBe(201);
    expect(res.body.workLog.status).toBe('pending');
    expect(res.body.workLog.credits).toBeUndefined(); // Server discarded credits
  });

  test('P3.3: CEO approves work with credits 1-5, rejects invalid credit rating', async () => {
    const work = await WorkLog.create({
      userId: memberUser._id,
      date: '2026-11-03',
      title: 'Fix responsive navigation',
      description: 'Refactored mobile menu breakpoint',
      hours: 4,
      status: 'pending'
    });

    // Attempting invalid credit 6
    const invalidRes = await request(app)
      .post(`/api/work/${work._id}/review`)
      .set('Authorization', `Bearer ${ceoToken}`)
      .send({ action: 'approve', credits: 6 });
    expect(invalidRes.status).toBe(400);

    // Valid approval with 4 credits
    const validRes = await request(app)
      .post(`/api/work/${work._id}/review`)
      .set('Authorization', `Bearer ${ceoToken}`)
      .send({ action: 'approve', credits: 4, reviewNote: 'Well done!' });

    expect(validRes.status).toBe(200);
    expect(validRes.body.workLog.status).toBe('approved');
    expect(validRes.body.workLog.credits).toBe(4);
    expect(validRes.body.workLog.reviewedBy).toBe(ceoUser._id.toString());
  });

  test('P3.4: Rejecting work requires a written reason, and locked approved records cannot be edited', async () => {
    const work = await WorkLog.create({
      userId: memberUser._id,
      date: '2026-11-03',
      title: 'Draft landing page design',
      description: 'Rough sketch in Figma',
      hours: 3,
      status: 'pending'
    });

    // Rejection without reason fails
    const failReject = await request(app)
      .post(`/api/work/${work._id}/review`)
      .set('Authorization', `Bearer ${ceoToken}`)
      .send({ action: 'reject', reviewNote: '' });

    expect(failReject.status).toBe(400);
    expect(failReject.body.error).toMatch(/written reason is required/i);

    // Rejection with valid reason
    const successReject = await request(app)
      .post(`/api/work/${work._id}/review`)
      .set('Authorization', `Bearer ${ceoToken}`)
      .send({ action: 'reject', reviewNote: 'Please include high-fidelity wireframes.' });

    expect(successReject.status).toBe(200);
    expect(successReject.body.workLog.status).toBe('rejected');

    // Approve a record, then verify it CANNOT be silently edited
    const approvedWork = await WorkLog.create({
      userId: memberUser._id,
      date: '2026-11-03',
      title: 'Approved Payment Gateway Fix',
      description: 'Fixed webhook retry logic',
      hours: 5,
      status: 'approved',
      credits: 5
    });

    const editRes = await request(app)
      .patch(`/api/work/${approvedWork._id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: 'Tampered title after approval' });

    expect(editRes.status).toBe(400);
    expect(editRes.body.error).toMatch(/Approved work records are locked and cannot be edited/i);
  });
});
