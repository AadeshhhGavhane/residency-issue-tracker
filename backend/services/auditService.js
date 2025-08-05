const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

// Industry-standard audit service for compliance
class AuditService {
  // Compliance-critical events that MUST be logged
  static COMPLIANCE_EVENTS = [
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
    'ASSIGNMENT_STARTED',
    'ASSIGNMENT_UPDATED',
    'ASSIGNMENT_TIME_UPDATED',
    // Feedback events
    'FEEDBACK_SUBMITTED'
  ];

  // Log compliance-critical user action
  static async logAction(userId, action, details = {}, req = null) {
    try {
      // Only log compliance-critical events to reduce database load
      if (!this.COMPLIANCE_EVENTS.includes(action)) {
        logger.debug('Skipping non-compliance audit log', { action });
        return null;
      }

      const auditLog = new AuditLog({
        userId,
        action,
        details: {
          ...details,
          // Add compliance-specific fields
          complianceEvent: true,
          dataRetention: '7 years', // GDPR requirement
          legalBasis: this.getLegalBasis(action)
        },
        ipAddress: req ? req.ip : 'unknown',
        userAgent: req ? req.get('User-Agent') : 'unknown',
        status: 'SUCCESS',
        metadata: {
          timestamp: new Date(),
          sessionId: req ? req.sessionID : null,
          // Add compliance metadata
          gdprArticle: this.getGDPRArticle(action),
          retentionPeriod: '7 years'
        }
      });
      
      await auditLog.save();
      
      logger.info('Compliance audit log created', {
        userId,
        action,
        logId: auditLog._id,
        complianceEvent: true
      });
      
      return auditLog;
    } catch (error) {
      logger.error('Failed to create compliance audit log', {
        userId,
        action,
        error: error.message
      });
      
      // Don't throw error - audit logging shouldn't break the main flow
      return null;
    }
  }

  // Get legal basis for GDPR compliance
  static getLegalBasis(action) {
    const legalBasisMap = {
      'USER_REGISTER': 'Consent (Article 6(1)(a))',
      'USER_LOGIN': 'Contract performance (Article 6(1)(b))',
      'USER_LOGOUT': 'Contract performance (Article 6(1)(b))',
      'ACCOUNT_DELETE': 'Legitimate interest (Article 6(1)(f))',
      'PASSWORD_CHANGE': 'Contract performance (Article 6(1)(b))',
      'PASSWORD_RESET_REQUEST': 'Legitimate interest (Article 6(1)(f))',
      'PASSWORD_RESET_COMPLETE': 'Contract performance (Article 6(1)(b))',
      'EMAIL_VERIFICATION': 'Consent (Article 6(1)(a))',
      // Issue tracking legal basis
      'ISSUE_CREATED': 'Contract performance (Article 6(1)(b))',
      'ISSUE_UPDATED': 'Contract performance (Article 6(1)(b))',
      'ISSUE_DELETED': 'Legitimate interest (Article 6(1)(f))',
      'ISSUE_ASSIGNED': 'Contract performance (Article 6(1)(b))',
      'ISSUE_STATUS_UPDATED': 'Contract performance (Article 6(1)(b))',
      'ASSIGNMENT_ACCEPTED': 'Contract performance (Article 6(1)(b))',
      'ASSIGNMENT_REJECTED': 'Contract performance (Article 6(1)(b))',
      'ASSIGNMENT_COMPLETED': 'Contract performance (Article 6(1)(b))',
      'ASSIGNMENT_STARTED': 'Contract performance (Article 6(1)(b))',
      'ASSIGNMENT_UPDATED': 'Contract performance (Article 6(1)(b))',
      'ASSIGNMENT_TIME_UPDATED': 'Contract performance (Article 6(1)(b))'
    };
    return legalBasisMap[action] || 'Legitimate interest (Article 6(1)(f))';
  }

  // Get GDPR article reference
  static getGDPRArticle(action) {
    const gdprMap = {
      'USER_REGISTER': 'Article 30 - Records of processing activities',
      'USER_LOGIN': 'Article 30 - Records of processing activities',
      'USER_LOGOUT': 'Article 30 - Records of processing activities',
      'ACCOUNT_DELETE': 'Article 17 - Right to erasure',
      'PASSWORD_CHANGE': 'Article 30 - Records of processing activities',
      'PASSWORD_RESET_REQUEST': 'Article 30 - Records of processing activities',
      'PASSWORD_RESET_COMPLETE': 'Article 30 - Records of processing activities',
      'EMAIL_VERIFICATION': 'Article 30 - Records of processing activities',
      // Issue tracking GDPR articles
      'ISSUE_CREATED': 'Article 30 - Records of processing activities',
      'ISSUE_UPDATED': 'Article 30 - Records of processing activities',
      'ISSUE_DELETED': 'Article 17 - Right to erasure',
      'ISSUE_ASSIGNED': 'Article 30 - Records of processing activities',
      'ISSUE_STATUS_UPDATED': 'Article 30 - Records of processing activities',
      'ASSIGNMENT_ACCEPTED': 'Article 30 - Records of processing activities',
      'ASSIGNMENT_REJECTED': 'Article 30 - Records of processing activities',
      'ASSIGNMENT_COMPLETED': 'Article 30 - Records of processing activities',
      'ASSIGNMENT_STARTED': 'Article 30 - Records of processing activities',
      'ASSIGNMENT_UPDATED': 'Article 30 - Records of processing activities',
      'ASSIGNMENT_TIME_UPDATED': 'Article 30 - Records of processing activities'
    };
    return gdprMap[action] || 'Article 30 - Records of processing activities';
  }
  
  // Log failed action (only for compliance events)
  static async logFailedAction(userId, action, details = {}, req = null, error = null) {
    try {
      // Only log compliance-critical failed events
      if (!this.COMPLIANCE_EVENTS.includes(action)) {
        logger.debug('Skipping non-compliance failed audit log', { action });
        return null;
      }

      const auditLog = new AuditLog({
        userId,
        action,
        details: {
          ...details,
          error: error ? error.message : 'Unknown error',
          complianceEvent: true,
          dataRetention: '7 years'
        },
        ipAddress: req ? req.ip : 'unknown',
        userAgent: req ? req.get('User-Agent') : 'unknown',
        status: 'FAILED',
        metadata: {
          timestamp: new Date(),
          sessionId: req ? req.sessionID : null,
          gdprArticle: this.getGDPRArticle(action),
          retentionPeriod: '7 years'
        }
      });
      
      await auditLog.save();
      
      logger.warn('Compliance failed action logged', {
        userId,
        action,
        logId: auditLog._id,
        error: error ? error.message : 'Unknown error',
        complianceEvent: true
      });
      
      return auditLog;
    } catch (error) {
      logger.error('Failed to create compliance audit log for failed action', {
        userId,
        action,
        error: error.message
      });
      
      return null;
    }
  }
  
  // Get user audit logs
  static async getUserAuditLogs(userId, limit = 50, skip = 0) {
    try {
      const logs = await AuditLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'name email');
      
      return logs;
    } catch (error) {
      logger.error('Failed to get user audit logs', {
        userId,
        error: error.message
      });
      
      throw new Error('Failed to retrieve audit logs');
    }
  }
  
  // Get audit logs by action
  static async getAuditLogsByAction(action, limit = 50, skip = 0) {
    try {
      const logs = await AuditLog.find({ action })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'name email');
      
      return logs;
    } catch (error) {
      logger.error('Failed to get audit logs by action', {
        action,
        error: error.message
      });
      
      throw new Error('Failed to retrieve audit logs');
    }
  }
  
  // Search audit logs
  static async searchAuditLogs(query, limit = 50, skip = 0) {
    try {
      const logs = await AuditLog.find({
        $text: { $search: query }
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'name email');
      
      return logs;
    } catch (error) {
      logger.error('Failed to search audit logs', {
        query,
        error: error.message
      });
      
      throw new Error('Failed to search audit logs');
    }
  }
  
  // Get audit statistics
  static async getAuditStats(userId = null, days = 30) {
    try {
      const dateFilter = {
        createdAt: {
          $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      };
      
      if (userId) {
        dateFilter.userId = userId;
      }
      
      const stats = await AuditLog.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      return stats;
    } catch (error) {
      logger.error('Failed to get audit statistics', {
        userId,
        days,
        error: error.message
      });
      
      throw new Error('Failed to retrieve audit statistics');
    }
  }
}

// Industry-standard compliance audit actions
const auditActions = {
  // Compliance-critical user actions (GDPR Article 30)
  logUserRegister: (userId, email, req) => 
    AuditService.logAction(userId, 'USER_REGISTER', { email }, req),
  
  logUserLogin: (userId, email, req) => 
    AuditService.logAction(userId, 'USER_LOGIN', { email }, req),
  
  logUserLogout: (userId, email, req) => 
    AuditService.logAction(userId, 'USER_LOGOUT', { email }, req),
  
  logAccountDelete: (userId, req) => 
    AuditService.logAction(userId, 'ACCOUNT_DELETE', {}, req),
  
  logEmailVerification: (userId, email, req) => 
    AuditService.logAction(userId, 'EMAIL_VERIFICATION', { email }, req),
  
  logMobileVerificationRequest: (userId, phoneNumber, req) => 
    AuditService.logAction(userId, 'MOBILE_VERIFICATION_REQUEST', { phoneNumber }, req),
  
  logMobileVerification: (userId, phoneNumber, req) => 
    AuditService.logAction(userId, 'MOBILE_VERIFICATION', { phoneNumber }, req),
  
  // Security events (compliance required)
  logLoginFailed: (email, req, error = null) => 
    AuditService.logFailedAction(null, 'LOGIN_FAILED', { email }, req, error),
  
  logPasswordResetRequest: (userId, email, req) => 
    AuditService.logAction(userId, 'PASSWORD_RESET_REQUEST', { email }, req),
  
  logPasswordResetComplete: (userId, req) => 
    AuditService.logAction(userId, 'PASSWORD_RESET_COMPLETE', {}, req),
  
  // Non-compliance events (application logs only)
  logProfileUpdate: (userId, updatedFields, req) => {
    // Profile updates go to application logs only (not compliance-critical)
    logger.info('Profile updated', { userId, updatedFields, ip: req?.ip });
    return null; // Don't store in audit DB
  },
  
  logVerificationEmailSent: (userId, email, req) => {
    // Email sending goes to application logs only
    logger.info('Verification email sent', { userId, email, ip: req?.ip });
    return null; // Don't store in audit DB
  },
  
  logResetEmailSent: (userId, email, req) => {
    // Email sending goes to application logs only
    logger.info('Reset email sent', { userId, email, ip: req?.ip });
    return null; // Don't store in audit DB
  }
};

module.exports = {
  AuditService,
  auditActions
}; 