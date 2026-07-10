const { dbQuery } = require('../config/db');
const nodemailer = require('nodemailer');
const { fetchAuth0User } = require('./auth0Service');

// Derive role based on configuration
function deriveRole(email) {
  if (!email) return 'alumni';
  const e = String(email).toLowerCase().trim();
  const domain = e.split('@')[1] || '';
  const admins = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const studentDomains = (process.env.STUDENT_EMAIL_DOMAINS || 'pvppcoe.ac.in').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const students = (process.env.STUDENT_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  if (admins.includes(e)) return 'admin';
  if (studentDomains.includes(domain)) return 'student';
  if (students.includes(e)) return 'student';
  return 'alumni';
}

// Upsert a basic user profile
async function upsertBasicUser({ auth0_id, email, name, picture }) {
  const sql = `
    INSERT INTO users (auth0_id, email, name, picture, user_type, approval_status)
    VALUES (?, ?, ?, ?, COALESCE(?, 'alumni'), COALESCE(?, 'pending'))
    ON CONFLICT (auth0_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, users.name),
      picture = COALESCE(EXCLUDED.picture, users.picture),
      user_type = COALESCE(EXCLUDED.user_type, users.user_type),
      approval_status = COALESCE(users.approval_status, EXCLUDED.approval_status)
    RETURNING *
  `;
  const result = await dbQuery(sql, [auth0_id, email || null, name || null, picture || null, deriveRole(email), 'pending']);
  return result.rows && result.rows[0];
}

// Read Alumni Auto Approve configuration
async function readAlumniAutoApproveSetting() {
  const ALUMNI_AUTO_APPROVE_KEY = 'alumni_auto_approve';
  const { rows } = await dbQuery('SELECT setting_value FROM site_settings WHERE setting_key = ? LIMIT 1', [ALUMNI_AUTO_APPROVE_KEY]);
  const value = rows && rows[0] ? rows[0].setting_value : null;
  if (!value) return false;
  if (typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, 'enabled')) return !!value.enabled;
    return false;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && Object.prototype.hasOwnProperty.call(parsed, 'enabled')) {
        return !!parsed.enabled;
      }
      return normalizeBooleanInput(parsed);
    } catch {
      return normalizeBooleanInput(value);
    }
  }
  return normalizeBooleanInput(value);
}

function normalizeBooleanInput(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    return lowered === 'true' || lowered === '1' || lowered === 'yes' || lowered === 'on';
  }
  return false;
}

// Send Alumni Approval email
async function sendAlumniApprovalEmail({ to, name, status, reason }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !to) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const safeName = name || 'Alumni';
  const normalizedStatus = String(status || '').toLowerCase();
  const isApproved = normalizedStatus === 'approved';
  const isRejected = normalizedStatus === 'rejected';
  const subject = isApproved
    ? 'Your alumni profile has been approved'
    : isRejected
      ? 'Your alumni profile was rejected'
      : 'Your alumni profile needs an update';

  const html = isApproved
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #4F46E5; color: #fff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Profile Approved</h1>
        </div>
        <div style="padding: 28px; background: #ffffff; color: #111827;">
          <p style="font-size: 16px; margin: 0 0 14px;">Hi ${safeName},</p>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 14px;">Your alumni profile has been approved. You can now access the alumni dashboard and community features.</p>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">Thank you for keeping your profile updated.</p>
        </div>
      </div>
    `
    : isRejected
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden;">
        <div style="background: #991B1B; color: #fff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Profile Rejected</h1>
        </div>
        <div style="padding: 28px; background: #ffffff; color: #111827;">
          <p style="font-size: 16px; margin: 0 0 14px;">Hi ${safeName},</p>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Your alumni profile was reviewed and was not approved at this time.</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin: 0 0 18px;">
            <p style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #b91c1c; text-transform: uppercase; letter-spacing: .08em;">Admin Feedback</p>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #7f1d1d;">${reason ? String(reason) : 'Please review your profile details and submit an updated application.'}</p>
          </div>
          <p style="font-size: 14px; line-height: 1.6; margin: 0; color: #6b7280;">You can update your profile and try again after making the requested changes.</p>
        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden;">
        <div style="background: #DC2626; color: #fff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Profile Review Feedback</h1>
        </div>
        <div style="padding: 28px; background: #ffffff; color: #111827;">
          <p style="font-size: 16px; margin: 0 0 14px;">Hi ${safeName},</p>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Your alumni profile was reviewed and needs a few updates before approval.</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin: 0 0 18px;">
            <p style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #b91c1c; text-transform: uppercase; letter-spacing: .08em;">Admin Feedback</p>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #7f1d1d;">${reason ? String(reason) : 'Please update your profile information and reapply.'}</p>
          </div>
          <p style="font-size: 14px; line-height: 1.6; margin: 0; color: #6b7280;">Please update your profile from the alumni settings page and submit it again for review.</p>
        </div>
      </div>
    `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
}

// Send Alumni Under Review email
async function sendAlumniUnderReviewEmail({ to, name }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !to) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const safeName = name || 'Alumni';
  const subject = 'Your alumni profile is under review';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #4F46E5; color: #fff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Profile Under Review</h1>
      </div>
      <div style="padding: 28px; background: #ffffff; color: #111827;">
        <p style="font-size: 16px; margin: 0 0 14px;">Hi ${safeName},</p>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 14px;">Thank you for registering. Your alumni profile has been submitted successfully and is currently under review by our admin team.</p>
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 14px;">We will notify you by email as soon as your account is approved.</p>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">Connecting Future Team</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
}

module.exports = {
  deriveRole,
  upsertBasicUser,
  readAlumniAutoApproveSetting,
  sendAlumniApprovalEmail,
  sendAlumniUnderReviewEmail
};
