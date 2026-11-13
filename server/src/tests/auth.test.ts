import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { config } from '../config/env.js';

describe('Phase 1 Auth Suite: Core Authentication, TOTP, and Role-Based Access Control', () => {
  let app: ReturnType<typeof createApp>;

  const testCeo = {
    name: 'ShiftPe CEO Test',
    email: 'test.ceo@shiftpe.com',
    password: 'CeoPassword123!',
    role: 'ceo' as const
  };

  const testMember = {
    name: 'Sample Member Test',
    email: 'test.alex@shiftpe.com',
    password: 'MemberPassword123!',
    role: 'member' as const
  };

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
    // Clean up test accounts
    await User.deleteMany({
      email: { $in: [testCeo.email, testMember.email, 'teammate@shiftpe.com', 'new.engineer@shiftpe.com'] }
    });
  });

  beforeEach(async () => {
    // Clean up any previous test instances
    await User.deleteMany({
      email: { $in: [testCeo.email, testMember.email, 'teammate@shiftpe.com', 'new.engineer@shiftpe.com'] }
    });

    // Seed CEO
    const ceoHash = await bcrypt.hash(testCeo.password, 10);
    await User.create({
      name: testCeo.name,
      email: testCeo.email,
      passwordHash: ceoHash,
      role: testCeo.role,
      status: 'active',
      totpEnabled: false
    });

    // Seed Member
    const memberHash = await bcrypt.hash(testMember.password, 10);
    await User.create({
      name: testMember.name,
      email: testMember.email,
      passwordHash: memberHash,
      role: testMember.role,
      status: 'active',
      totpEnabled: false
    });
  });

  test('1. Rejects login if email is not from @shiftpe.com domain', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'intruder@gmail.com', password: 'Password123!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/@shiftpe\.com/i);
  });

  test('2. Returns 401 when entering a WRONG password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testCeo.email, password: 'WrongPassword999!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  test('3. Returns 401 when entering a WRONG TOTP code', async () => {
    // Step A: Login with correct password to get tempToken
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testCeo.email, password: testCeo.password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.status).toBe('totp_setup_required');
    expect(loginRes.body.tempToken).toBeDefined();

    const tempToken = loginRes.body.tempToken;

    // Step B: Submit incorrect 6-digit TOTP code
    const verifyRes = await request(app)
      .post('/api/auth/totp-verify')
      .send({ tempToken, code: '000000' });

    expect(verifyRes.status).toBe(401);
    expect(verifyRes.body.error).toMatch(/Invalid 6-digit authenticator code/i);
  });

  test('4. Successfully verifies valid TOTP code and returns session cookie & token', async () => {
    // Step A: Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testCeo.email, password: testCeo.password });

    const { tempToken, manualSecret } = loginRes.body;
    expect(manualSecret).toBeDefined();

    // Step B: Generate correct 6-digit code from secret
    const validCode = authenticator.generate(manualSecret);

    const verifyRes = await request(app)
      .post('/api/auth/totp-verify')
      .send({ tempToken, code: validCode });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.token).toBeDefined();
    expect(verifyRes.body.user.email).toBe(testCeo.email);
    expect(verifyRes.headers['set-cookie']).toBeDefined();
  });

  test('5. Returns 403 Forbidden when a member calls a CEO-only route', async () => {
    // Step A: Login as regular member
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testMember.email, password: testMember.password });

    const validCode = authenticator.generate(loginRes.body.manualSecret);
    const verifyRes = await request(app)
      .post('/api/auth/totp-verify')
      .send({ tempToken: loginRes.body.tempToken, code: validCode });

    const memberToken = verifyRes.body.token;

    // Step B: Member attempts to access CEO-only endpoint
    const ceoRouteRes = await request(app)
      .get('/api/auth/ceo-only')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(ceoRouteRes.status).toBe(403);
    expect(ceoRouteRes.body.error).toMatch(/Forbidden: role 'member' is not authorized/i);

    // Step C: Member attempts to invite another user (CEO only)
    const inviteRes = await request(app)
      .post('/api/auth/invite')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        name: 'New Teammate',
        email: 'teammate@shiftpe.com',
        initialPassword: 'Password123!'
      });

    expect(inviteRes.status).toBe(403);
  });

  test('6. Allows CEO to access CEO-only route and invite new users', async () => {
    // Login as CEO
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testCeo.email, password: testCeo.password });

    const validCode = authenticator.generate(loginRes.body.manualSecret);
    const verifyRes = await request(app)
      .post('/api/auth/totp-verify')
      .send({ tempToken: loginRes.body.tempToken, code: validCode });

    const ceoToken = verifyRes.body.token;

    // Access CEO endpoint
    const ceoRes = await request(app)
      .get('/api/auth/ceo-only')
      .set('Authorization', `Bearer ${ceoToken}`);

    expect(ceoRes.status).toBe(200);
    expect(ceoRes.body.message).toMatch(/Welcome to CEO command area/i);

    // Invite new user
    const inviteRes = await request(app)
      .post('/api/auth/invite')
      .set('Authorization', `Bearer ${ceoToken}`)
      .send({
        name: 'New Engineer',
        email: 'new.engineer@shiftpe.com',
        role: 'member',
        designation: 'Staff Engineer',
        domain: 'Engineering',
        initialPassword: 'StrongPassword123!'
      });

    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.user.email).toBe('new.engineer@shiftpe.com');
  });
});
