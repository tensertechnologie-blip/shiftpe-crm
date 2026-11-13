import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { WorkLog } from '../models/WorkLog.js';
import { Task } from '../models/Task.js';
import { Salary } from '../models/Salary.js';
import { AuditLog } from '../models/AuditLog.js';
import { config } from '../config/env.js';

describe('Phase 5 Security Suite: IDOR Protection, Strict RBAC & Audit Trails', () => {
  let app: ReturnType<typeof createApp>;

  let ceoUser: any;
  let attackerMember: any;
  let victimMember: any;

  let ceoToken: string;
  let attackerToken: string;

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
    const ids = [ceoUser?._id, attackerMember?._id, victimMember?._id].filter(Boolean);
    await User.deleteMany({ _id: { $in: ids } });
    await WorkLog.deleteMany({ userId: { $in: ids } });
    await Task.deleteMany({ assigneeId: { $in: ids } });
    await Salary.deleteMany({ userId: { $in: ids } });
    await AuditLog.deleteMany({ actorId: { $in: ids } });
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    const hash = await bcrypt.hash('SecurePass123!', 10);
    await User.deleteMany({ email: { $in: ['sec_ceo@shiftpe.com', 'sec_att@shiftpe.com', 'sec_vic@shiftpe.com'] } });

    ceoUser = await User.create({
      name: 'CEO Ajay Sec',
      email: 'sec_ceo@shiftpe.com',
      passwordHash: hash,
      role: 'ceo',
      status: 'active',
      totpEnabled: true
    });

    attackerMember = await User.create({
      name: 'Attacker Member',
      email: 'sec_att@shiftpe.com',
      passwordHash: hash,
      role: 'member',
      status: 'active',
      totpEnabled: true
    });

    victimMember = await User.create({
      name: 'Victim Member',
      email: 'sec_vic@shiftpe.com',
      passwordHash: hash,
      role: 'member',
      status: 'active',
      totpEnabled: true
    });

    ceoToken = jwt.sign(
      { userId: ceoUser._id.toString(), email: ceoUser.email, role: 'ceo', name: ceoUser.name },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    attackerToken = jwt.sign(
      { userId: attackerMember._id.toString(), email: attackerMember.email, role: 'member', name: attackerMember.name },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  test('SEC-1 (IDOR): Block member from modifying another user profile via :id parameter', async () => {
    const res = await request(app)
      .patch(`/api/users/${victimMember._id}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ phone: '+91 0000000000' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Forbidden/i);
  });

  test('SEC-2 (IDOR): Block member from editing another teammate work submission', async () => {
    const victimWork = await WorkLog.create({
      userId: victimMember._id,
      date: '2026-11-03',
      title: 'Victim Work',
      description: 'Original Work',
      hours: 4,
      status: 'pending'
    });

    const res = await request(app)
      .patch(`/api/work/${victimWork._id}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ title: 'Tampered Deliverable by Attacker' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Forbidden/i);
  });

  test('SEC-3 (IDOR): Block member from modifying another teammate assigned task', async () => {
    const victimTask = await Task.create({
      assigneeId: victimMember._id,
      title: 'Victim Task',
      status: 'todo',
      priority: 'high',
      createdBy: ceoUser._id
    });

    const res = await request(app)
      .patch(`/api/tasks/${victimTask._id}/status`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ status: 'done' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Forbidden/i);
  });

  test('SEC-4 (Audit Trail): Verify audit log is permanently created when CEO approves deliverables', async () => {
    const work = await WorkLog.create({
      userId: victimMember._id,
      date: '2026-11-03',
      title: 'Audit Target Deliverable',
      description: 'Audit Test',
      hours: 5,
      status: 'pending'
    });

    const res = await request(app)
      .post(`/api/work/${work._id}/review`)
      .set('Authorization', `Bearer ${ceoToken}`)
      .send({ action: 'approve', credits: 5, reviewNote: 'Outstanding work verified' });

    expect(res.status).toBe(200);

    // Verify AuditLog entry was written
    const auditRecord = await AuditLog.findOne({
      targetId: work._id.toString(),
      action: 'work_approved'
    });

    expect(auditRecord).toBeDefined();
    expect(auditRecord?.actorEmail).toBe(ceoUser.email);
    expect(auditRecord?.actorRole).toBe('ceo');
    expect(auditRecord?.targetType).toBe('WorkLog');
    expect(auditRecord?.details.credits).toBe(5);
  });

  test('SEC-5: Restrict Audit Log endpoint exclusively to CEO', async () => {
    // Member attempt -> 403
    const memberRes = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${attackerToken}`);

    expect(memberRes.status).toBe(403);

    // CEO attempt -> 200
    const ceoRes = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${ceoToken}`);

    expect(ceoRes.status).toBe(200);
    expect(Array.isArray(ceoRes.body.logs)).toBe(true);
  });
});
