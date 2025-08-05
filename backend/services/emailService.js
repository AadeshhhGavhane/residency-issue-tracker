const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create transporter
const createTransporter = () => {
  // For development, use Gmail or a test service
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Use app password for Gmail
      }
    });
  }
  
  // For production, use a proper email service
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

// Email templates
const emailTemplates = {
  passwordReset: (resetToken, userName) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>You have requested to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email from Auth Starter Kit. Please do not reply.
        </p>
      </div>
    `
  }),

  emailVerification: (verificationToken, userName) => ({
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Auth Starter Kit!</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/verify-email.html?token=${verificationToken}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>This link will expire in 24 hours.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email from Auth Starter Kit. Please do not reply.
        </p>
      </div>
    `
  }),

  passwordChanged: (userName) => ({
    subject: 'Password Changed Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Changed</h2>
        <p>Hello ${userName},</p>
        <p>Your password has been successfully changed.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email from Auth Starter Kit. Please do not reply.
        </p>
      </div>
    `
  }),

  // Issue tracking email templates
  issueNotification: (data) => ({
    subject: `New Issue Reported: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Issue Reported</h2>
        <p>A new issue has been reported in your residential society:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">${data.title}</h3>
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Priority:</strong> ${data.priority}</p>
          <p><strong>Reported by:</strong> ${data.reportedBy}</p>
          <p><strong>Issue ID:</strong> ${data.issueId}</p>
        </div>
        <p>Please review and assign this issue to an appropriate technician.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from Residential Society Issue Tracker.
        </p>
      </div>
    `
  }),

  assignmentNotification: (data) => ({
    subject: `New Assignment: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Assignment</h2>
        <p>You have been assigned a new issue:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">${data.title}</h3>
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Priority:</strong> ${data.priority}</p>
          <p><strong>Assigned by:</strong> ${data.assignedBy}</p>
          <p><strong>Estimated time:</strong> ${data.estimatedTime ? `${data.estimatedTime} hours` : 'Not specified'}</p>
        </div>
        <p>Please review the issue details and begin work as soon as possible.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from Residential Society Issue Tracker.
        </p>
      </div>
    `
  }),

  assignmentAcceptedNotification: (data) => ({
    subject: `Assignment Accepted: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Assignment Accepted</h2>
        <p>The following assignment has been accepted:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">${data.title}</h3>
          <p><strong>Technician:</strong> ${data.technicianName}</p>
          <p><strong>Status:</strong> Accepted</p>
        </div>
        <p>The technician will begin work on this issue.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from Residential Society Issue Tracker.
        </p>
      </div>
    `
  }),

  assignmentStartedNotification: (data) => ({
    subject: `Work Started: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ffc107;">Work Started</h2>
        <p>The technician has started working on the following assignment:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">${data.title}</h3>
          <p><strong>Technician:</strong> ${data.technicianName}</p>
          <p><strong>Status:</strong> In Progress</p>
        </div>
        <p>The work is now in progress. You will be notified when it's completed.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from Residential Society Issue Tracker.
        </p>
      </div>
    `
  }),

  assignmentRejectedNotification: (data) => ({
    subject: `Assignment Rejected: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Assignment Rejected</h2>
        <p>The following assignment has been rejected:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">${data.title}</h3>
          <p><strong>Technician:</strong> ${data.technicianName}</p>
          <p><strong>Reason:</strong> ${data.reason}</p>
        </div>
        <p>Please reassign this issue to another technician.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from Residential Society Issue Tracker.
        </p>
      </div>
    `
  }),

  assignmentCompletedNotification: (data) => ({
    subject: `Assignment Completed: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Assignment Completed</h2>
        <p>The following assignment has been completed:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">${data.title}</h3>
          <p><strong>Technician:</strong> ${data.technicianName}</p>
          <p><strong>Time spent:</strong> ${data.timeSpent} minutes</p>
          <p><strong>Notes:</strong> ${data.notes || 'No notes provided'}</p>
        </div>
        <p>The issue has been marked as resolved.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from Residential Society Issue Tracker.
        </p>
      </div>
    `
  }),

  issueResolvedNotification: (data) => ({
    subject: `Issue Resolved: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Issue Resolved</h2>
        <p>Your reported issue has been resolved:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">${data.title}</h3>
          <p><strong>Status:</strong> ${data.status}</p>
        </div>
        <p>Thank you for reporting this issue. We appreciate your patience.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from Residential Society Issue Tracker.
        </p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
  try {
    const transporter = createTransporter();
    const { subject, html } = emailTemplates[template](data.token || data.verificationToken || data, data.userName);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@authstarterkit.com',
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Email sending error:', error);
    throw error;
  }
};

// Specific email functions
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  return await sendEmail(email, 'passwordReset', { token: resetToken, userName });
};

const sendVerificationEmail = async (email, verificationToken, userName) => {
  return await sendEmail(email, 'emailVerification', { verificationToken, userName });
};

const sendPasswordChangedEmail = async (email, userName) => {
  return await sendEmail(email, 'passwordChanged', { userName });
};

// Issue tracking email functions
const sendIssueNotification = async (email, data) => {
  return await sendEmail(email, 'issueNotification', data);
};

const sendAssignmentNotification = async (email, data) => {
  return await sendEmail(email, 'assignmentNotification', data);
};

const sendAssignmentAcceptedNotification = async (email, data) => {
  return await sendEmail(email, 'assignmentAcceptedNotification', data);
};

const sendAssignmentRejectedNotification = async (email, data) => {
  return await sendEmail(email, 'assignmentRejectedNotification', data);
};

const sendAssignmentCompletedNotification = async (email, data) => {
  return await sendEmail(email, 'assignmentCompletedNotification', data);
};

const sendAssignmentStartedNotification = async (email, data) => {
  return await sendEmail(email, 'assignmentStartedNotification', data);
};

const sendIssueResolvedNotification = async (email, data) => {
  return await sendEmail(email, 'issueResolvedNotification', data);
};

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendPasswordChangedEmail,
  sendIssueNotification,
  sendAssignmentNotification,
  sendAssignmentAcceptedNotification,
  sendAssignmentRejectedNotification,
  sendAssignmentCompletedNotification,
  sendAssignmentStartedNotification,
  sendIssueResolvedNotification
}; 