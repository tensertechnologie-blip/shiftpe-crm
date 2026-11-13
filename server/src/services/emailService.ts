import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  if (config.smtp.user && config.smtp.pass) {
    // Standard SMTP connection (e.g. Google Workspace, Gmail, SES, Sendgrid)
    transporter = nodemailer.createTransport({
      host: config.smtp.host || 'smtp.gmail.com',
      port: config.smtp.port || 587,
      secure: config.smtp.secure || false,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    });
    console.log('[EmailService] Initialized SMTP transporter with host:', config.smtp.host || 'smtp.gmail.com');
  }

  return transporter;
}

export async function sendTemporaryPasswordEmail(
  toEmail: string,
  userName: string,
  temporaryPassword: string
): Promise<{ success: boolean; preview?: string; error?: string }> {
  const mailTransporter = getTransporter();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F1730; color: #FFFFFF; margin: 0; padding: 24px; }
    .container { max-width: 540px; margin: 0 auto; background-color: #141D3B; border: 1px solid #222F5A; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { text-align: center; margin-bottom: 24px; }
    .badge { display: inline-block; width: 36px; height: 36px; line-height: 36px; background-color: #FF5F55; border-radius: 50%; color: #FFFFFF; font-weight: 900; font-size: 18px; margin-bottom: 8px; }
    .wordmark { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .wordmark span.pe { color: #FF5F55; }
    .wordmark span.shift { color: #FFFFFF; }
    .tagline { color: #8E9BB5; font-size: 12.5px; margin-top: 4px; }
    .body-content { font-size: 14px; line-height: 1.6; color: #D1D5DB; }
    .pwd-box { background-color: #0F1730; border: 1px solid #FF5F55; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center; }
    .pwd-label { font-size: 11px; text-transform: uppercase; color: #8E9BB5; letter-spacing: 0.8px; font-weight: 700; margin-bottom: 6px; }
    .pwd-code { font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 700; color: #FF5F55; letter-spacing: 2px; }
    .steps { background-color: rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 16px; margin-top: 20px; border: 1px solid #222F5A; }
    .step-item { font-size: 12.5px; color: #8E9BB5; margin-bottom: 8px; }
    .step-item strong { color: #FFFFFF; }
    .btn { display: inline-block; background-color: #FF5F55; color: #FFFFFF !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; font-size: 11.5px; color: #5F6E8C; margin-top: 28px; border-top: 1px solid #222F5A; paddingTop: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">S</div>
      <div class="wordmark"><span class="shift">Shift</span><span class="pe">Pe</span></div>
      <div class="tagline">Find work. Near you. • Team Portal</div>
    </div>

    <div class="body-content">
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Welcome to the official <strong>ShiftPe Team Portal</strong>. A teammate account has been initiated for your business email (<code>${toEmail}</code>).</p>
      
      <div class="pwd-box">
        <div class="pwd-label">Your Temporary Access Password</div>
        <div class="pwd-code">${temporaryPassword}</div>
      </div>

      <div class="steps">
        <div class="step-item">1. <strong>Sign In:</strong> Navigate to the portal login with your email and this temporary password.</div>
        <div class="step-item">2. <strong>2FA Verification:</strong> Scan the Google Authenticator QR code to secure your session.</div>
        <div class="step-item">3. <strong>Complete Onboarding:</strong> Enter your full details (designation, domain, phone) and set your permanent password.</div>
      </div>

      <div style="text-align: center;">
        <a href="${config.clientOrigin}" class="btn">Access ShiftPe Portal &rarr;</a>
      </div>
    </div>

    <div class="footer">
      Confidential ShiftPe Intranet System &bull; Restricted to @shiftpe.in & @shiftpe.com<br>
      If you did not request this account, please notify ajay.founder@shiftpe.in immediately.
    </div>
  </div>
</body>
</html>
  `;

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: config.smtp.from,
        to: toEmail,
        subject: '🔐 Your ShiftPe Team Portal Access Password',
        text: `Welcome to ShiftPe, ${userName}! Your temporary login password is: ${temporaryPassword}. Sign in at ${config.clientOrigin} and complete your teammate onboarding.`,
        html: htmlContent
      });

      console.log(`[EmailService] Temporary password email sent to ${toEmail}. MessageId: ${info.messageId}`);
      return { success: true };
    } catch (err: any) {
      console.error('[EmailService] SMTP error sending email:', err);
      return { success: false, error: err.message };
    }
  } else {
    // Development fallback when SMTP_USER is not yet populated
    console.log('\n======================================================');
    console.log(`[EmailService Simulated Email Delivery (Development Mode)]`);
    console.log(`To: ${toEmail}`);
    console.log(`Subject: 🔐 Your ShiftPe Team Portal Access Password`);
    console.log(`Temporary Password: ${temporaryPassword}`);
    console.log(`Login URL: ${config.clientOrigin}`);
    console.log('======================================================\n');
    return { success: true, preview: temporaryPassword };
  }
}
