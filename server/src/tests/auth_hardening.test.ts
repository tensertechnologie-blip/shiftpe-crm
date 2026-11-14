import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { DirectoryAccess } from '../models/DirectoryAccess.js';
import { config } from '../config/env.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_32_characters_minimum_secure_key!';

describe('Auth Hardening & Security Controls Suite', () => {
  let app: ReturnType<typeof createApp>;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 60000);

  beforeEach(async () => {
    await User.deleteMany({});
    await DirectoryAccess.deleteMany({});
  });

  it('1. login with bypassTotp:true does NOT return a session', async () => {
    const email = 'ajay.founder@shiftpe.in';
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 10);
    const secret = authenticator.generateSecret();

    await User.create({
      name: 'Ajay Founder',
      email,
      passwordHash,
      role: 'ceo',
      status: 'active',
      totpEnabled: true,
      totpSecret: secret
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password, bypassTotp: true });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('totp_required');
    expect(res.body.token).toBeUndefined();
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('2. verify-totp rejects codes 888999 and 123456', async () => {
    const email = 'ajay.founder@shiftpe.in';
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 10);
    const secret = authenticator.generateSecret();

    const user = await User.create({
      name: 'Ajay Founder',
      email,
      passwordHash,
      role: 'ceo',
      status: 'active',
      totpEnabled: true,
      totpSecret: secret
    });

    const tempToken = jwt.sign(
      { userId: user._id.toString(), purpose: 'totp_verify' },
      config.jwtSecret,
      { expiresIn: '10m' }
    );

    const res1 = await request(app)
      .post('/api/auth/totp-verify')
      .send({ tempToken, code: '888999' });

    expect(res1.status).toBe(401);
    expect(res1.body.token).toBeUndefined();

    const res2 = await request(app)
      .post('/api/auth/totp-verify')
      .send({ tempToken, code: '123456' });

    expect(res2.status).toBe(401);
    expect(res2.body.token).toBeUndefined();
  });

  it('3. a totp temp token used as a Bearer token on GET /api/auth/me returns 401', async () => {
    const email = 'ajay.founder@shiftpe.in';
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const user = await User.create({
      name: 'Ajay Founder',
      email,
      passwordHash,
      role: 'ceo',
      status: 'active',
      totpEnabled: true
    });

    const tempToken = jwt.sign(
      { userId: user._id.toString(), purpose: 'totp_verify' },
      config.jwtSecret,
      { expiresIn: '10m' }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tempToken}`);

    expect(res.status).toBe(401);
  });

  it('4. a user set to status inactive gets 401 with their previously issued valid session token', async () => {
    const email = 'ajay.founder@shiftpe.in';
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const user = await User.create({
      name: 'Ajay Founder',
      email,
      passwordHash,
      role: 'ceo',
      status: 'active',
      totpEnabled: true
    });

    const sessionToken = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role, name: user.name, purpose: 'session' },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    // Verify it works when active
    const activeRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${sessionToken}`);
    expect(activeRes.status).toBe(200);

    // Deactivate user in database
    await User.updateOne({ _id: user._id }, { status: 'inactive' });

    // Request with same token must now be rejected
    const inactiveRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(inactiveRes.status).toBe(401);
  });

  it('5. POST /api/auth/register never returns a password field and does not change the passwordHash of an existing user', async () => {
    const email = 'ritesh.founder@shiftpe.in';
    const originalPassword = 'InitialPermanentPassword123!';
    const originalHash = await bcrypt.hash(originalPassword, 10);

    const user = await User.create({
      name: 'Ritesh Founder',
      email,
      passwordHash: originalHash,
      role: 'member',
      status: 'active',
      onboardingCompleted: true,
      isTemporaryPassword: false
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, name: 'Attempted Overwrite' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.password).toBeUndefined();
    expect(res.body.devPassword).toBeUndefined();
    expect(res.body.tempPassword).toBeUndefined();

    // Verify password hash in database did not change
    const refreshedUser = await User.findById(user._id);
    expect(refreshedUser?.passwordHash).toBe(originalHash);
  });

  it('6. a member with email x.founder@shiftpe.in cannot call POST /api/access/directory/revoke (403)', async () => {
    const email = 'x.founder@shiftpe.in';
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const memberUser = await User.create({
      name: 'Member Impersonating Founder',
      email,
      passwordHash,
      role: 'member',
      status: 'active',
      totpEnabled: true
    });

    const memberToken = jwt.sign(
      { userId: memberUser._id.toString(), email: memberUser.email, role: memberUser.role, name: memberUser.name, purpose: 'session' },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    const res = await request(app)
      .post('/api/access/directory/revoke')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ email: 'target.user@shiftpe.com' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Forbidden/i);
  });

  it('7. 5 wrong passwords lock the account (429 on the 6th attempt)', async () => {
    const email = 'ajay.founder@shiftpe.in';
    const correctPassword = 'CorrectPassword123!';
    const passwordHash = await bcrypt.hash(correctPassword, 10);

    await User.create({
      name: 'Ajay Founder',
      email,
      passwordHash,
      role: 'ceo',
      status: 'active',
      totpEnabled: true
    });

    // Attempts 1 to 5: wrong password
    for (let i = 1; i <= 5; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'WrongPassword999!' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    }

    // 6th attempt: account must be locked with 429
    const lockRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: correctPassword });

    expect(lockRes.status).toBe(429);
    expect(lockRes.body.error).toMatch(/Account temporarily locked/i);
  });

  it('8. malformed JSON returns 400 with Invalid JSON body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "broken-json');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid JSON body');
  });

  it('9. member gets 403 on /users/:id/unlock', async () => {
    const member = await User.create({
      name: 'Regular Member',
      email: 'member@shiftpe.in',
      passwordHash: await bcrypt.hash('Password123!', 10),
      role: 'member',
      status: 'active'
    });

    const memberToken = jwt.sign(
      { userId: member._id.toString(), email: member.email, role: member.role, name: member.name, purpose: 'session' },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    const dummyId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post(`/api/auth/users/${dummyId}/unlock`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });

  it('10. CEO can unlock a locked user and then log in with the correct password', async () => {
    const ceo = await User.create({
      name: 'Ajay CEO',
      email: 'ajay.ceo@shiftpe.in',
      passwordHash: await bcrypt.hash('CeoPassword123!', 10),
      role: 'ceo',
      status: 'active'
    });

    const ceoToken = jwt.sign(
      { userId: ceo._id.toString(), email: ceo.email, role: ceo.role, name: ceo.name, purpose: 'session' },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    const userEmail = 'test.locked@shiftpe.in';
    const userPass = 'UserPassword123!';
    await DirectoryAccess.create({
      email: userEmail,
      status: 'active',
      addedBy: ceo._id
    });
    const user = await User.create({
      name: 'Locked User',
      email: userEmail,
      passwordHash: await bcrypt.hash(userPass, 10),
      role: 'member',
      status: 'active',
      failedAttempts: 5,
      lockUntil: new Date(Date.now() + 15 * 60 * 1000)
    });

    // Verify user is locked (login gives 429)
    const lockedRes = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: userPass });
    expect(lockedRes.status).toBe(429);

    // CEO unlocks the user
    const unlockRes = await request(app)
      .post(`/api/auth/users/${user._id}/unlock`)
      .set('Authorization', `Bearer ${ceoToken}`);

    expect(unlockRes.status).toBe(200);
    expect(unlockRes.body.message).toBe('Account unlocked');

    // User can now log in with correct password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: userPass });

    expect(loginRes.status).toBe(200);
  });
});
