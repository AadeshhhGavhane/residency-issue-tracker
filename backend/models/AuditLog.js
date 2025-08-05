const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Can be null for failed login attempts
  },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_REGISTER',
      'USER_LOGIN',
      'USER_LOGOUT',
      'PASSWORD_CHANGE',
      'PASSWORD_RESET_REQUEST',
      'PASSWORD_RESET_COMPLETE',
      'PROFILE_UPDATE',
      'EMAIL_VERIFICATION',
      'ACCOUNT_DELETE',
      'LOGIN_FAILED',
      'VERIFICATION_EMAIL_SENT',
      'RESET_EMAIL_SENT',
      // Issue tracking events
      'ISSUE_CREATED',
      'ISSUE_UPDATED',
      'ISSUE_DELETED',
      'ISSUE_ASSIGNED',
      'ISSUE_STATUS_UPDATED',
      // Assignment events
      'ASSIGNMENT_ACCEPTED',
      'ASSIGNMENT_REJECTED',
      'ASSIGNMENT_COMPLETED',
      'ASSIGNMENT_UPDATED',
      'ASSIGNMENT_TIME_UPDATED'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });

// Add text search for details
auditLogSchema.index({ 
  action: 'text', 
  'details.email': 'text' 
});

module.exports = mongoose.model('AuditLog', auditLogSchema); 