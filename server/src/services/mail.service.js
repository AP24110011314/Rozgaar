import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

class MailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    if (env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    } else {
      // In development or test without explicit credentials, create ethereal or stub
      if (env.NODE_ENV !== 'test') {
        try {
          const testAccount = await nodemailer.createTestAccount();
          this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
          console.log(`✉️ MailService initialized with Ethereal account: ${testAccount.user}`);
        } catch (err) {
          console.warn('⚠️ Could not initialize Ethereal mailer, falling back to mock logger:', err.message);
        }
      }
    }
  }

  /**
   * Fire-and-forget email dispatch
   */
  async sendMail({ to, subject, html, text }) {
    // Non-blocking fire-and-forget
    setImmediate(async () => {
      try {
        if (!this.transporter) {
          if (env.NODE_ENV !== 'test') {
            console.log(`[Mock Mail] To: ${to} | Subject: ${subject}`);
          }
          return;
        }

        const info = await this.transporter.sendMail({
          from: env.EMAIL_FROM,
          to,
          subject,
          text,
          html,
        });

        if (env.NODE_ENV !== 'test') {
          console.log(`✉️ Email sent to ${to}: ${info.messageId}`);
          const previewUrl = nodemailer.getTestMessageUrl(info);
          if (previewUrl) {
            console.log(`🔗 Preview Email: ${previewUrl}`);
          }
        }
      } catch (err) {
        console.error(`❌ Failed to send email to ${to}:`, err.message);
      }
    });
  }

  sendVerificationEmail(to, name, token) {
    const verifyUrl = `${env.CLIENT_ORIGIN}/verify-email?token=${token}`;
    const subject = 'Verify your Rozgaar Account';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
        <h2 style="color: #2563eb;">रोज़गार Rozgaar</h2>
        <p>Namaste <strong>${name}</strong>,</p>
        <p>Thank you for creating an account on Rozgaar, your local ATS.</p>
        <p>Please click the button below to verify your email address. This link expires in 1 hour.</p>
        <p style="margin: 25px 0;">
          <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
        </p>
        <p style="font-size: 13px; color: #64748b;">Or copy this link into your browser: <br/><a href="${verifyUrl}">${verifyUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">If you did not create this account, please ignore this email.</p>
      </div>
    `;
    const text = `Verify your Rozgaar account by visiting: ${verifyUrl}`;
    return this.sendMail({ to, subject, html, text });
  }

  sendPasswordResetEmail(to, name, token) {
    const resetUrl = `${env.CLIENT_ORIGIN}/reset-password?token=${token}`;
    const subject = 'Reset your Rozgaar Password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
        <h2 style="color: #2563eb;">रोज़गार Rozgaar</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset your password for your Rozgaar account.</p>
        <p>Click the button below to set a new password. This link is valid for 1 hour and can only be used once.</p>
        <p style="margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </p>
        <p style="font-size: 13px; color: #64748b;">Or copy this link: <br/><a href="${resetUrl}">${resetUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `;
    const text = `Reset your Rozgaar password by visiting: ${resetUrl}`;
    return this.sendMail({ to, subject, html, text });
  }

  sendStageChangeEmail({ to, name, jobTitle, companyName, stage, message }) {
    const stageTitles = {
      applied: 'Applied',
      reviewing: 'Under Review',
      interviewing: 'Interviewing',
      offered: 'Job Offer Extended',
      hired: 'Hired 🎉',
      rejected: 'Application Not Selected',
      withdrawn: 'Application Withdrawn',
    };
    const stageDisplay = stageTitles[stage] || stage;
    const subject = `Application Update: ${stageDisplay} - ${jobTitle} at ${companyName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
        <h2 style="color: #2563eb;">रोज़गार Rozgaar</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your application status for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated to:</p>
        <div style="background-color: #f1f5f9; padding: 14px 20px; border-radius: 8px; font-weight: bold; font-size: 16px; color: #0f172a; margin: 15px 0;">
          ${stageDisplay}
        </div>
        ${
          message
            ? `<p><strong>Message from Employer:</strong></p>
               <blockquote style="background-color: #f8fafc; border-left: 4px solid #2563eb; margin: 0; padding: 12px 16px; color: #475569; font-style: italic;">
                 ${message}
               </blockquote>`
            : ''
        }
        <p style="margin: 25px 0;">
          <a href="${env.CLIENT_ORIGIN}/me/applications" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Live Timeline</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Rozgaar Local ATS • Transparent status updates without the ghosting.</p>
      </div>
    `;
    const text = `Your application status for ${jobTitle} at ${companyName} has been updated to ${stageDisplay}.${message ? ` Message: ${message}` : ''}`;
    return this.sendMail({ to, subject, html, text });
  }

  sendApplicationReceivedEmail({ to, recruiterName, applicantName, jobTitle }) {
    const subject = `New Candidate Applied: ${applicantName} for ${jobTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
        <h2 style="color: #2563eb;">रोज़गार Rozgaar</h2>
        <p>Hello <strong>${recruiterName}</strong>,</p>
        <p>A new applicant <strong>${applicantName}</strong> has just applied for your open job listing: <strong>${jobTitle}</strong>.</p>
        <p style="margin: 25px 0;">
          <a href="${env.CLIENT_ORIGIN}/recruiter/jobs" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review on Kanban Board</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Rozgaar Local ATS • Manage candidates collaboratively.</p>
      </div>
    `;
    const text = `New applicant ${applicantName} has applied for ${jobTitle}. Review in your Rozgaar employer pipeline.`;
    return this.sendMail({ to, subject, html, text });
  }
}

export const mailService = new MailService();
