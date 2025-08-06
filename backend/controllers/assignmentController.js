const Assignment = require('../models/Assignment');
const Issue = require('../models/Issue');
const User = require('../models/User');
const logger = require('../config/logger');
const { AuditService } = require('../services/auditService');
const emailService = require('../services/emailService');
const { clearCache } = require('../middleware/cache');
const { 
  sendAssignmentAcceptedNotificationWhatsApp,
  sendAssignmentRejectedNotificationWhatsApp,
  sendAssignmentStartedNotificationWhatsApp,
  sendAssignmentCompletedNotificationWhatsApp,
  sendIssueResolvedNotificationWhatsApp
} = require('../services/whatsappService');

/**
 * Get all assignments (filtered by user role)
 * @route GET /api/assignments
 * @access Private
 */
const getAssignments = async (req, res) => {
  try {
    const {
      status,
      priority,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter based on user role
    let filter = {};
    
    if (req.user.role === 'technician') {
      filter.assignedTo = req.user._id;
    } else if (req.user.role === 'committee') {
      // Committee can see all assignments
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Staff privileges required'
      });
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const assignments = await Assignment.find(filter)
      .select('status priority assignedAt estimatedCompletionTime paymentAmount issue assignedTo assignedBy')
      .populate('issue', 'title description category priority status address')
      .populate('assignedTo', 'name email phoneNumber')
      .populate('assignedBy', 'name email')
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(); // Use lean() for better performance

    const total = await Assignment.countDocuments(filter);

    logger.info(`Assignments retrieved: ${assignments.length} by user: ${req.user._id}`);

    res.json({
      success: true,
      data: {
        assignments,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    logger.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving assignments'
    });
  }
};

/**
 * Get assignment by ID
 * @route GET /api/assignments/:assignmentId
 * @access Private
 */
const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId)
      .populate('issue', 'title description category priority status location address')
      .populate('assignedTo', 'name email phoneNumber specializations')
      .populate('assignedBy', 'name email');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    logger.info(`Assignment retrieved: ${assignment._id} by user: ${req.user._id}`);

    res.json({
      success: true,
      data: { assignment }
    });

  } catch (error) {
    logger.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving assignment'
    });
  }
};

/**
 * Update assignment
 * @route PUT /api/assignments/:assignmentId
 * @access Private
 */
const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated directly
    delete updateData.issue;
    delete updateData.assignedTo;
    delete updateData.assignedBy;
    delete updateData.assignedAt;

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.assignmentId,
      updateData,
      { new: true, runValidators: true }
    ).populate(['issue', 'assignedTo', 'assignedBy'], 'name email title');

    // Log audit event
    await AuditService.logAction(req.user._id, 'ASSIGNMENT_UPDATED', {
      assignmentId: assignment._id,
      updatedFields: Object.keys(updateData)
    });

    logger.info(`Assignment updated: ${assignment._id} by user: ${req.user._id}`);

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: { assignment: updatedAssignment }
    });

  } catch (error) {
    logger.error('Update assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment'
    });
  }
};

/**
 * Accept assignment
 * @route POST /api/assignments/:assignmentId/accept
 * @access Private (Technician only)
 */
const acceptAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Assignment is not pending'
      });
    }

    await assignment.accept();

    // Clear cache for assignments and issues
    clearCache('/api/assignments');
    clearCache('/api/issues');

    // Update issue status
    const issue = await Issue.findById(assignment.issue);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found for this assignment'
      });
    }
    
    await issue.updateStatus('assigned');

    // Log audit event
    await AuditService.logAction(req.user._id, 'ASSIGNMENT_ACCEPTED', {
      assignmentId: assignment._id,
      issueId: assignment.issue
    });

    // Send notification to committee
    const committeeMember = await User.findById(assignment.assignedBy);
    if (committeeMember) {
      try {
        await emailService.sendAssignmentAcceptedNotification(committeeMember.email, {
          assignmentId: assignment._id,
          title: issue.title || 'Issue',
          technicianName: req.user.name
        });
        
        // Send WhatsApp notification to committee member
        if (committeeMember.phoneNumber && committeeMember.isMobileVerified) {
          await sendAssignmentAcceptedNotificationWhatsApp(committeeMember.phoneNumber, {
            assignmentId: assignment._id,
            title: issue.title || 'Issue',
            technicianName: req.user.name
          });
        }
      } catch (notificationError) {
        logger.error('Error sending notification to committee:', notificationError);
        // Don't fail the assignment acceptance if notification fails
      }
    }

    // Fetch the updated assignment with populated fields
    const updatedAssignment = await Assignment.findById(assignment._id)
      .populate('issue', 'title description category priority status address')
      .populate('assignedTo', 'name email phoneNumber')
      .populate('assignedBy', 'name email');

    logger.info(`Assignment accepted: ${assignment._id} by technician: ${req.user._id}`);

    res.json({
      success: true,
      message: 'Assignment accepted successfully',
      data: { assignment: updatedAssignment }
    });

  } catch (error) {
    logger.error('Accept assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting assignment'
    });
  }
};

/**
 * Reject assignment
 * @route POST /api/assignments/:assignmentId/reject
 * @access Private (Technician only)
 */
const rejectAssignment = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const assignment = await Assignment.findById(req.params.assignmentId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Assignment is not pending'
      });
    }

    await assignment.reject(reason);

    // Update issue status back to new
    const issue = await Issue.findById(assignment.issue);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found for this assignment'
      });
    }
    
    issue.assignedTo = null;
    issue.assignedBy = null;
    issue.status = 'new';
    issue.assignedAt = null;
    await issue.save();

    // Log audit event
    await AuditService.logAction(req.user._id, 'ASSIGNMENT_REJECTED', {
      assignmentId: assignment._id,
      issueId: assignment.issue,
      reason
    });

    // Send notification to committee
    const committeeMember = await User.findById(assignment.assignedBy);
    if (committeeMember) {
      try {
        await emailService.sendAssignmentRejectedNotification(committeeMember.email, {
          assignmentId: assignment._id,
          title: issue.title || 'Issue',
          technicianName: req.user.name,
          reason
        });
        
        // Send WhatsApp notification to committee member
        if (committeeMember.phoneNumber && committeeMember.isMobileVerified) {
          await sendAssignmentRejectedNotificationWhatsApp(committeeMember.phoneNumber, {
            assignmentId: assignment._id,
            title: issue.title || 'Issue',
            technicianName: req.user.name,
            reason
          });
        }
      } catch (notificationError) {
        logger.error('Error sending notification to committee:', notificationError);
        // Don't fail the assignment rejection if notification fails
      }
    }

    // Send notification to resident (issue reporter)
    const resident = await User.findById(issue.reportedBy);
    if (resident) {
      try {
        await emailService.sendAssignmentRejectedNotification(resident.email, {
          assignmentId: assignment._id,
          title: issue.title || 'Issue',
          technicianName: req.user.name,
          reason
        });
        
        // Send WhatsApp notification to resident
        if (resident.phoneNumber && resident.isMobileVerified) {
          await sendAssignmentRejectedNotificationWhatsApp(resident.phoneNumber, {
            assignmentId: assignment._id,
            title: issue.title || 'Issue',
            technicianName: req.user.name,
            reason
          });
        }
      } catch (notificationError) {
        logger.error('Error sending notification to resident:', notificationError);
        // Don't fail the assignment rejection if notification fails
      }
    }

    logger.info(`Assignment rejected: ${assignment._id} by technician: ${req.user._id}`);

    // Fetch the updated assignment with populated fields
    const updatedAssignment = await Assignment.findById(assignment._id)
      .populate('issue', 'title description category priority status address')
      .populate('assignedTo', 'name email phoneNumber')
      .populate('assignedBy', 'name email');

    res.json({
      success: true,
      message: 'Assignment rejected successfully',
      data: { assignment: updatedAssignment }
    });

  } catch (error) {
    logger.error('Reject assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting assignment'
    });
  }
};

/**
 * Complete assignment
 * @route POST /api/assignments/:assignmentId/complete
 * @access Private (Technician only)
 */
const completeAssignment = async (req, res) => {
  try {
    const { completionNotes, timeSpent, materialsUsed } = req.body;

    const assignment = await Assignment.findById(req.params.assignmentId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.status === 'completed' || assignment.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Assignment is already completed or rejected'
      });
    }

    // Update assignment
    assignment.completionNotes = completionNotes || '';
    
    // Handle materialsUsed - transform string to proper format if needed
    if (materialsUsed) {
      if (typeof materialsUsed === 'string' && materialsUsed.trim()) {
        // Convert simple string to proper materials array format
        assignment.materialsUsed = [{
          name: materialsUsed.trim(),
          quantity: 1,
          unit: 'piece',
          cost: 0
        }];
      } else if (Array.isArray(materialsUsed)) {
        // Use as-is if it's already an array
        assignment.materialsUsed = materialsUsed;
      } else {
        // Set empty array if invalid input
        assignment.materialsUsed = [];
      }
    } else {
      assignment.materialsUsed = [];
    }

    // Validate timeSpent if provided
    if (timeSpent !== undefined && timeSpent !== null) {
      const timeSpentNum = parseInt(timeSpent);
      if (isNaN(timeSpentNum) || timeSpentNum < 0) {
        return res.status(400).json({
          success: false,
          message: 'Time spent must be a valid positive number'
        });
      }
      assignment.timeSpent = timeSpentNum;
    }

    await assignment.complete(completionNotes);

    // Update issue status
    const issue = await Issue.findById(assignment.issue);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found for this assignment'
      });
    }
    
    await issue.updateStatus('resolved');

    // Log audit event
    await AuditService.logAction(req.user._id, 'ASSIGNMENT_COMPLETED', {
      assignmentId: assignment._id,
      issueId: assignment.issue,
      timeSpent,
      materialsUsed: materialsUsed?.length || 0
    });

    // Send notification to reporter
    const reporter = await User.findById(issue.reportedBy);
    if (reporter) {
      try {
        await emailService.sendIssueResolvedNotification(reporter.email, {
          issueId: issue._id,
          title: issue.title || 'Issue',
          status: 'resolved',
          completedBy: req.user.name
        });
        
        // Send WhatsApp notification to reporter
        if (reporter.phoneNumber && reporter.isMobileVerified) {
          await sendIssueResolvedNotificationWhatsApp(reporter.phoneNumber, {
            issueId: issue._id,
            title: issue.title || 'Issue',
            status: 'resolved',
            completedBy: req.user.name
          });
        }
      } catch (notificationError) {
        logger.error('Error sending notification to reporter:', notificationError);
        // Don't fail the assignment completion if notification fails
      }
    }

    // Send notification to committee
    const committeeMember = await User.findById(assignment.assignedBy);
    if (committeeMember) {
      try {
        await emailService.sendAssignmentCompletedNotification(committeeMember.email, {
          assignmentId: assignment._id,
          issueTitle: issue.title || 'Issue',
          technicianName: req.user.name,
          timeSpent,
          completionNotes
        });
        
        // Send WhatsApp notification to committee member
        if (committeeMember.phoneNumber && committeeMember.isMobileVerified) {
          await sendAssignmentCompletedNotificationWhatsApp(committeeMember.phoneNumber, {
            assignmentId: assignment._id,
            issueTitle: issue.title || 'Issue',
            technicianName: req.user.name,
            timeSpent,
            completionNotes
          });
        }
      } catch (notificationError) {
        logger.error('Error sending notification to committee:', notificationError);
        // Don't fail the assignment completion if notification fails
      }
    }

    logger.info(`Assignment completed: ${assignment._id} by technician: ${req.user._id}`);

    // Fetch the updated assignment with populated fields
    const updatedAssignment = await Assignment.findById(assignment._id)
      .populate('issue', 'title description category priority status address')
      .populate('assignedTo', 'name email phoneNumber')
      .populate('assignedBy', 'name email');

    res.json({
      success: true,
      message: 'Assignment completed successfully',
      data: { assignment: updatedAssignment }
    });

  } catch (error) {
    logger.error('Complete assignment error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Error completing assignment';
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Invalid data provided. Please check your input.';
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid data format provided.';
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate assignment completion detected.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update time spent on assignment
 * @route PUT /api/assignments/:assignmentId/time
 * @access Private
 */
const updateTimeSpent = async (req, res) => {
  try {
    const { timeSpent } = req.body;

    if (timeSpent === undefined || timeSpent < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid time spent is required'
      });
    }

    const assignment = await Assignment.findById(req.params.assignmentId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    assignment.timeSpent = timeSpent;
    await assignment.save();

    // Log audit event
    await AuditService.logAction(req.user._id, 'ASSIGNMENT_TIME_UPDATED', {
      assignmentId: assignment._id,
      timeSpent
    });

    logger.info(`Assignment time updated: ${assignment._id} to ${timeSpent} minutes by user: ${req.user._id}`);

    res.json({
      success: true,
      message: 'Time spent updated successfully',
      data: { assignment }
    });

  } catch (error) {
    logger.error('Update time spent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating time spent'
    });
  }
};

/**
 * Start work on assignment
 * @route POST /api/assignments/:assignmentId/start
 * @access Private (Technician only)
 */
const startWork = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Assignment must be accepted before starting work'
      });
    }

    // Check if technician is assigned to this assignment
    if (assignment.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only start work on your own assignments'
      });
    }

    await assignment.startWork();

    // Update issue status to in_progress
    const issue = await Issue.findById(assignment.issue);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found for this assignment'
      });
    }
    
    await issue.updateStatus('in_progress');

    // Log audit event
    await AuditService.logAction(req.user._id, 'ASSIGNMENT_STARTED', {
      assignmentId: assignment._id,
      issueId: assignment.issue
    }, req);

    // Send notification to committee
    const committeeMember = await User.findById(assignment.assignedBy);
    if (committeeMember) {
      try {
        await emailService.sendAssignmentStartedNotification(committeeMember.email, {
          assignmentId: assignment._id,
          title: issue.title || 'Issue',
          technicianName: req.user.name
        });
        
        // Send WhatsApp notification to committee member
        if (committeeMember.phoneNumber && committeeMember.isMobileVerified) {
          await sendAssignmentStartedNotificationWhatsApp(committeeMember.phoneNumber, {
            assignmentId: assignment._id,
            title: issue.title || 'Issue',
            technicianName: req.user.name
          });
        }
      } catch (notificationError) {
        logger.error('Error sending notification to committee:', notificationError);
        // Don't fail the work start if notification fails
      }
    }

    // Send notification to resident (issue reporter)
    const resident = await User.findById(issue.reportedBy);
    if (resident) {
      try {
        await emailService.sendAssignmentStartedNotification(resident.email, {
          assignmentId: assignment._id,
          title: issue.title || 'Issue',
          technicianName: req.user.name
        });
        
        // Send WhatsApp notification to resident
        if (resident.phoneNumber && resident.isMobileVerified) {
          await sendAssignmentStartedNotificationWhatsApp(resident.phoneNumber, {
            assignmentId: assignment._id,
            title: issue.title || 'Issue',
            technicianName: req.user.name
          });
        }
      } catch (notificationError) {
        logger.error('Error sending notification to resident:', notificationError);
        // Don't fail the work start if notification fails
      }
    }

    logger.info(`Work started on assignment: ${assignment._id} by technician: ${req.user._id}`);

    // Fetch the updated assignment with populated fields
    const updatedAssignment = await Assignment.findById(assignment._id)
      .populate('issue', 'title description category priority status address')
      .populate('assignedTo', 'name email phoneNumber')
      .populate('assignedBy', 'name email');

    res.json({
      success: true,
      message: 'Work started successfully',
      data: { assignment: updatedAssignment }
    });

  } catch (error) {
    logger.error('Start work error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting work'
    });
  }
};

/**
 * Get available technicians
 * @route GET /api/assignments/technicians
 * @access Private (Committee only)
 */
const getTechnicians = async (req, res) => {
  try {
    const { specialization } = req.query;

    let filter = { role: 'technician' };
    if (specialization) {
      filter.specializations = specialization;
    }

    const technicians = await User.find(filter)
      .select('name email phoneNumber specializations')
      .sort({ name: 1 });

    logger.info(`Technicians retrieved: ${technicians.length} by user: ${req.user._id}`);

    res.json({
      success: true,
      data: { technicians }
    });

  } catch (error) {
    logger.error('Get technicians error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving technicians'
    });
  }
};

/**
 * Get assignment analytics
 * @route GET /api/assignments/analytics
 * @access Private (Staff only)
 */
const getAnalytics = async (req, res) => {
  try {
    const { period = 'month', technicianId } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build filter
    let filter = { assignedAt: { $gte: startDate } };
    if (technicianId) filter.assignedTo = technicianId;

    // Get analytics data
    const totalAssignments = await Assignment.countDocuments(filter);
    const completedAssignments = await Assignment.countDocuments({ ...filter, status: 'completed' });
    const pendingAssignments = await Assignment.countDocuments({ ...filter, status: { $in: ['pending', 'accepted', 'in_progress'] } });

    // Status distribution
    const statusStats = await Assignment.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Priority distribution
    const priorityStats = await Assignment.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Average completion time
    const completedAssignmentsWithTime = await Assignment.find({
      ...filter,
      status: 'completed',
      actualCompletionTime: { $exists: true }
    });

    const totalCompletionTime = completedAssignmentsWithTime.reduce((sum, assignment) => {
      return sum + (assignment.duration || 0);
    }, 0);

    const averageCompletionTime = completedAssignmentsWithTime.length > 0 
      ? totalCompletionTime / completedAssignmentsWithTime.length 
      : 0;

    // Technician performance (if technicianId not specified)
    let technicianStats = [];
    if (!technicianId) {
      technicianStats = await Assignment.aggregate([
        { $match: filter },
        { $lookup: { from: 'users', localField: 'assignedTo', foreignField: '_id', as: 'technician' } },
        { $unwind: '$technician' },
        { $group: { 
          _id: '$assignedTo', 
          technicianName: { $first: '$technician.name' },
          totalAssignments: { $sum: 1 },
          completedAssignments: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          averageTime: { $avg: '$timeSpent' }
        }},
        { $sort: { completedAssignments: -1 } }
      ]);
    }

    logger.info(`Assignment analytics retrieved for period: ${period} by user: ${req.user._id}`);

    res.json({
      success: true,
      data: {
        period,
        totalAssignments,
        completedAssignments,
        pendingAssignments,
        completionRate: totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0,
        averageCompletionTime,
        statusStats,
        priorityStats,
        technicianStats
      }
    });

  } catch (error) {
    logger.error('Get assignment analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving assignment analytics'
    });
  }
};

module.exports = {
  getAssignments,
  getAssignment,
  updateAssignment,
  acceptAssignment,
  rejectAssignment,
  completeAssignment,
  updateTimeSpent,
  startWork,
  getTechnicians,
  getAnalytics
}; 