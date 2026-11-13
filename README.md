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

## 4. How to Host 100% Freely on Vercel (Auto-Deploy on GitHub Edit)

Because you already use Vercel for ShiftPe, the repository is configured with a unified [`vercel.json`](file:///d:/shiftpe_app/CRM/CRM-mark1/vercel.json) and serverless function adapter ([`api/index.js`](file:///d:/shiftpe_app/CRM/CRM-mark1/api/index.js)):
- **Frontend (React/Vite)**: Deployed to Vercel's global edge network (`client/dist`).
- **Backend (Express API)**: Runs as a Vercel Serverless Function handling all `/api/*` endpoints.
- **Custom Domain**: Easily map `crm.shiftpe.com` in Vercel Domain Settings.

### Step 1: Push Code to GitHub

Open your terminal in `d:\shiftpe_app\CRM\CRM-mark1` and push the branch to your GitHub repository:

```bash
git push -u origin main
```

---

### Step 2: Import & Deploy on Vercel (1-Click)

1. Go to **[vercel.com/dashboard](https://vercel.com/dashboard)**.
2. Click **Add New...** &rarr; **Project**.
3. Select the repository: `tensertechnologie-blip/shiftpe-crm`.
4. Vercel automatically reads [`vercel.json`](file:///d:/shiftpe_app/CRM/CRM-mark1/vercel.json) with build command `npm run build` and output directory `client/dist`.
5. Under **Environment Variables**, add:
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://tensertechnologie_db_user:dCSaOlUUOKulokYv@cluster0.hipta7v.mongodb.net/shiftpe_crm?retryWrites=true&w=majority
   JWT_SECRET=shiftpe_super_secret_jwt_key_2026_dev_prod_auth_token_9999
   CLIENT_ORIGIN=https://<your-project-name>.vercel.app
   CEO_EMAIL=ajay.founder@shiftpe.in
   CEO_PASSWORD=ShiftPeCeo2026!
   CEO_NAME=Ajay (Founder & CEO)
   CEO_PHONE=+91 9876543210
   ```
6. In **MongoDB Atlas** &rarr; **Security** &rarr; **Network Access**:
   - Ensure `0.0.0.0/0` is allowed so Vercel's serverless nodes can reach Atlas.
7. Click **Deploy**.

---

### Step 3: Edit on GitHub & Instant Continuous Deployment

Every time you edit code directly on GitHub or push a commit, Vercel triggers a new build and deploys it live in seconds!

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
