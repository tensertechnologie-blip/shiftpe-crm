import request from 'supertest';
import mongoose from 'mongoose';
import { authenticator } from 'otplib';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { config } from '../config/env.js';

describe('Teammate Registration, Directory Whitelist & Onboarding Suite', () => {
  let app: ReturnType<typeof createApp>;
  const whitelistedEmail = 'ritesh.founder@shiftpe.in';
  const unauthorizedEmail = 'dummy.user@shiftpe.in';

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
    await User.deleteMany({ email: { $in: [whitelistedEmail, unauthorizedEmail] } });
  });

  beforeEach(async () => {
    await User.deleteMany({ email: { $in: [whitelistedEmail, unauthorizedEmail] } });
  });

  it('1. should REJECT registration with an email not in the directory whitelist', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: unauthorizedEmail, name: 'Dummy User' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/whitelist/i);
  });

  it('2. should ACCEPT registration with a whitelisted business email and generate temporary password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: whitelistedEmail, name: 'Ritesh Founder' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.devPassword).toBeDefined();

    const createdUser = await User.findOne({ email: whitelistedEmail });
    expect(createdUser).not.toBeNull();
    expect(createdUser?.onboardingCompleted).toBe(false);
    expect(createdUser?.isTemporaryPassword).toBe(true);
  });

  it('3. should complete the full flow: Register -> Login -> 2FA -> Skip Onboarding -> Task Assigned -> Complete Onboarding', async () => {
    // Step A: Register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: whitelistedEmail, name: 'Ritesh' });

    expect(regRes.status).toBe(200);
    const tempPassword = regRes.body.devPassword;
    expect(tempPassword).toBeDefined();

    // Step B: Login with temporary password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: whitelistedEmail, password: tempPassword });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.status).toBe('totp_setup_required');
    expect(loginRes.body.tempToken).toBeDefined();
    expect(loginRes.body.manualSecret).toBeDefined();

    // Step C: Verify 2FA
    const totpToken = authenticator.generate(loginRes.body.manualSecret);
    const totpRes = await request(app)
      .post('/api/auth/totp-verify')
      .send({ tempToken: loginRes.body.tempToken, code: totpToken });

    expect(totpRes.status).toBe(200);
    expect(totpRes.body.user.onboardingCompleted).toBe(false);
    const sessionToken = totpRes.body.token;

    // Step D: Skip Onboarding
    const skipRes = await request(app)
      .post('/api/auth/onboarding/skip')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(skipRes.status).toBe(200);
    expect(skipRes.body.user.onboardingSkipped).toBe(true);
    expect(skipRes.body.user.onboardingCompleted).toBe(false);

    // Verify task was automatically created
    const userDoc = await User.findOne({ email: whitelistedEmail });
    const assignedTask = await Task.findOne({
      assigneeId: userDoc?._id,
      title: 'Complete Teammate Onboarding & Profile'
    });
    expect(assignedTask).not.toBeNull();
    expect(assignedTask?.status).toBe('todo');
    expect(assignedTask?.priority).toBe('high');

    // Step E: Complete Onboarding with full details & permanent password
    const onboardingRes = await request(app)
      .post('/api/auth/onboarding')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        name: 'Ritesh (Co-Founder)',
        phone: '+91 9876543299',
        domain: 'Executive',
        designation: 'Co-Founder & COO',
        skills: ['Operations', 'Growth', 'Partnerships'],
        newPassword: 'PermanentRitesh2026!'
      });

    expect(onboardingRes.status).toBe(200);
    expect(onboardingRes.body.user.onboardingCompleted).toBe(true);
    expect(onboardingRes.body.user.designation).toBe('Co-Founder & COO');

    // Verify task is now marked done
    const updatedTask = await Task.findOne({
      assigneeId: userDoc?._id,
      title: 'Complete Teammate Onboarding & Profile'
    });
    expect(updatedTask?.status).toBe('done');
  });
});
