# ShiftPe Team Portal (`crm.shiftpe.com`)

The official internal team portal and enterprise intranet for **ShiftPe** teammates, leadership, and founders. It gives every teammate verified check-ins, automated task checklists, work contribution tracking, an enterprise customer wiki, and confidential monthly payslips.

---

## 1. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Lucide Icons, Plain CSS Variables |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB Atlas via Mongoose ODM |
| **Authentication** | Corporate Directory Whitelist, bcrypt passwords, TOTP 2FA (`otplib`, `qrcode`), JWT in cookies / Bearer headers |
| **Security** | Dynamic Directory Access, RBAC, Helmet, Zod Validation, Immutable Audit Logging |
| **Deployment** | 1-Click Free Hosting on **Render** (monorepo full-stack) or **Vercel** + **Render** / **Railway** |

---

## 2. ShiftPe Brand Design System

Declared in `client/src/styles/theme.css`:
- **Coral Red (`#FF5F55`)**: Primary brand action color, active badges, and "Pe" wordmark.
- **Deep Navy (`#0F1730`)**: Dark theme foundation and primary light-mode typography.
- **Pure White (`#FFFFFF`)**: Dark theme typography and light theme surface card elevation.
- **Off White (`#F8F9FC`)**: Light theme canvas background.
- **Slate Accent (`#8E9BB5` / `#57657E`)**: Tagline `"Find work. Near you."` and subtle UI labels.

---

## 3. Key Portal Modules & Capabilities

1. **Dynamic CRM Access App (CEO / Founder Control)**:
   - Dynamic database whitelist (`DirectoryAccess`).
   - CEO can enter any teammate's business email (`@shiftpe.in` or `@shiftpe.com`) to instantly grant sign-up and sign-in permissions.
   - 1-Click access revocation immediately terminates or blocks user sessions.
2. **First-Time Teammate Registration & Onboarding**:
   - Authorized teammates receive an automated temporary password dispatched to their corporate email.
   - Onboarding form collects Phone, Department, Designation, and allows setting a permanent password.
   - "Skip for now" option automatically assigns a high-priority task to the teammate's Daily Checklist.
3. **Notification Flyout Panel**:
   - Real-time coral badge counter in the top bar with alerts for pending profile onboarding, assigned tasks, and security notices.
4. **ShiftPe Enterprise Wiki & Customer Directory**:
   - Enterprise customer case studies at scale (Blinkit, Zepto, etc.) with shift volume telemetry, operational hubs, SLAs, and verified privacy policies.
   - **Granular RBAC**: Documents can be classified as `Company Wide` (visible to all teammates) or `Executive Only` (restricted strictly to CEO & Founders with 403 enforcement).
5. **Daily Attendance**:
   - Check-in / check-out with verified server timestamps.
6. **Work Deliverables & CEO Credit Approvals**:
   - Teammates log work items and PR links; CEO reviews, credits, or rejects with feedback.
7. **20-Week Activity Heatmap**:
   - Contribution graph computed dynamically from approved deliverables.
8. **Confidential Payslips**:
   - Encrypted monthly compensation records accessible exclusively by the individual member and the CEO.

---

## 4. How to Host 100% Freely with GitHub (Auto-Deploy on Edit)

Because the project is connected to GitHub, whenever you edit or commit code on GitHub, your live app will automatically rebuild and deploy for free!

### Step 1: Push Your Code to GitHub

```bash
# 1. Initialize git
git init -b main

# 2. Stage all files (sensitive .env files are automatically excluded by .gitignore)
git add .

# 3. Commit your codebase
git commit -m "Initial commit: ShiftPe CRM Portal with Dynamic Access & Customer Wiki"

# 4. Create a new empty repository on your GitHub account (e.g. shiftpe-crm)

# 5. Link and push to GitHub
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/shiftpe-crm.git
git push -u origin main
```

---

### Step 2: Deploy 100% Freely on Render (Single Full-Stack Web Service)

Render offers a generous **Free Tier** for Web Services:

1. Go to [render.com](https://render.com) and sign in with your GitHub account.
2. Click **New +** &rarr; **Web Service**.
3. Select your `shiftpe-crm` GitHub repository.
4. Configure the service:
   - **Name**: `shiftpe-crm` (or your chosen name)
   - **Environment**: `Node`
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **Advanced** &rarr; **Add Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://tensertechnologie_db_user:dCSaOlUUOKulokYv@cluster0.hipta7v.mongodb.net/shiftpe_crm?retryWrites=true&w=majority
   JWT_SECRET=shiftpe_super_secret_jwt_key_2026_dev_prod_auth_token_9999
   CLIENT_ORIGIN=https://<your-render-app-name>.onrender.com
   CEO_EMAIL=ajay.founder@shiftpe.in
   CEO_PASSWORD=ShiftPeCeo2026!
   CEO_NAME=Ajay (Founder & CEO)
   CEO_PHONE=+91 9876543210
   ```
6. In **MongoDB Atlas** &rarr; **Security** &rarr; **Network Access**:
   - Add `0.0.0.0/0` (Allow access from anywhere) so Render cloud instances can connect seamlessly.
7. Click **Create Web Service**.
   - Render will build both the frontend and backend, serving your full portal at `https://<your-app>.onrender.com`!

---

### Step 3: Edit Directly on GitHub

Whenever you edit files on GitHub (via GitHub's web editor `.` key or by pushing commits), Render detects the commit on the `main` branch and automatically redeploys your portal!

---

## 5. Local Development Runbook

```bash
# 1. Install all root, server, and client dependencies
npm run install:all

# 2. Seed database (creates CEO and sample data)
npm run seed

# 3. Start local development servers (Express on :5000, Vite on :5173)
npm run dev
```
