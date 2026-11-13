import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { WorkLog } from '../models/WorkLog.js';
import { Task } from '../models/Task.js';
import { Salary } from '../models/Salary.js';
import { config } from '../config/env.js';

describe('Phase 4 Test Suite: Contribution Graph, Tasks, and Confidential Salary', () => {
  let app: ReturnType<typeof createApp>;

  let ceoUser: any;
  let memberA: any;
  let memberB: any;

  let ceoToken: string;
  let memberAToken: string;
  let memberBToken: string;

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
    const ids = [ceoUser?._id, memberA?._id, memberB?._id].filter(Boolean);
    await User.deleteMany({ _id: { $in: ids } });
    await WorkLog.deleteMany({ userId: { $in: ids } });
    await Task.deleteMany({ assigneeId: { $in: ids } });
    await Salary.deleteMany({ userId: { $in: ids } });
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    const hash = await bcrypt.hash('TestPass123!', 10);

    await User.deleteMany({ email: { $in: ['test_ceo4@shiftpe.com', 'test_memA4@shiftpe.com', 'test_memB4@shiftpe.com'] } });

    ceoUser = await User.create({
      name: 'CEO Phase4',
      email: 'test_ceo4@shiftpe.com',
      passwordHash: hash,
      role: 'ceo',
      designation: 'CEO',
      domain: 'Executive',
      status: 'active',
      totpEnabled: true
    });

    memberA = await User.create({
      name: 'Member Alice',
      email: 'test_memA4@shiftpe.com',
      passwordHash: hash,
      role: 'member',
      designation: 'Dev',
      domain: 'Engineering',
      status: 'active',
      totpEnabled: true
    });

    memberB = await User.create({
      name: 'Member Bob',
      email: 'test_memB4@shiftpe.com',
      passwordHash: hash,
      role: 'member',
      designation: 'Designer',
      domain: 'Design',
      status: 'active',
      totpEnabled: true
    });

    ceoToken = jwt.sign(
      { userId: ceoUser._id.toString(), email: ceoUser.email, role: 'ceo', name: ceoUser.name },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    memberAToken = jwt.sign(
      { userId: memberA._id.toString(), email: memberA.email, role: 'member', name: memberA.name },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    memberBToken = jwt.sign(
      { userId: memberB._id.toString(), email: memberB.email, role: 'member', name: memberB.name },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  test('P4.1: Contribution graph dynamically computed from approved workLogs (20 weeks)', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Seed 1 approved log for memberA
    await WorkLog.create({
      userId: memberA._id,
      date: today,
      title: 'Built Heatmap',
      description: 'Tested graph aggregation',
      hours: 5,
      status: 'approved',
      credits: 4
    });

    // Seed 1 pending log (should NOT count in graph)
    await WorkLog.create({
      userId: memberA._id,
      date: today,
      title: 'Unreviewed Work',
      description: 'Pending review',
      hours: 3,
      status: 'pending'
    });

    const res = await request(app)
      .get('/api/work/contributions')
      .set('Authorization', `Bearer ${memberAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.days).toHaveLength(140); // 20 weeks
    expect(res.body.totalCredits).toBe(4);
    expect(res.body.totalSubmissions).toBe(1);
  });

  test('P4.2: Tasks: CEO assigns tasks; members see only their own assigned tasks', async () => {
    // CEO creates task for memberA
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${ceoToken}`)
      .send({
        assigneeId: memberA._id.toString(),
        title: 'Review PR #42',
        description: 'Verify security patches',
        dueDate: '2026-11-10',
        priority: 'high'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.task.title).toBe('Review PR #42');

    // Member A views their tasks
    const memberARes = await request(app)
      .get('/api/tasks/my')
      .set('Authorization', `Bearer ${memberAToken}`);

    expect(memberARes.status).toBe(200);
    expect(memberARes.body.tasks).toHaveLength(1);
    expect(memberARes.body.tasks[0].title).toBe('Review PR #42');

    // Member B views their tasks (must NOT see Member A's task!)
    const memberBRes = await request(app)
      .get('/api/tasks/my')
      .set('Authorization', `Bearer ${memberBToken}`);

    expect(memberBRes.status).toBe(200);
    expect(memberBRes.body.tasks).toHaveLength(0);
  });

  test('P4.3: Confidential Salary: member sees only their own; member cannot access all salaries (403)', async () => {
    // CEO seeds salary for memberA (120,000) and memberB (135,000)
    await Salary.create({
      userId: memberA._id,
      month: '2026-10',
      amount: 120000,
      paid: true,
      paidOn: new Date()
    });

    await Salary.create({
      userId: memberB._id,
      month: '2026-10',
      amount: 135000,
      paid: false
    });

    // Member A views own salary
    const aSalaryRes = await request(app)
      .get('/api/salary/my')
      .set('Authorization', `Bearer ${memberAToken}`);

    expect(aSalaryRes.status).toBe(200);
    expect(aSalaryRes.body.salaries).toHaveLength(1);
    expect(aSalaryRes.body.salaries[0].amount).toBe(120000);

    // Member A attempts to access company-wide payroll endpoint
    const forbiddenRes = await request(app)
      .get('/api/salary/all')
      .set('Authorization', `Bearer ${memberAToken}`);

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.error).toMatch(/Forbidden/i);

    // CEO accesses company-wide payroll
    const ceoSalaryRes = await request(app)
      .get('/api/salary/all')
      .set('Authorization', `Bearer ${ceoToken}`);

    expect(ceoSalaryRes.status).toBe(200);
    expect(ceoSalaryRes.body.salaries.length).toBeGreaterThanOrEqual(2);
  });
});
