const Issue = require('../models/Issue');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const cloudinary = require('cloudinary').v2;
const logger = require('../config/logger');
const { AuditService } = require('../services/auditService');
const emailService = require('../services/emailService');

/**
 * Create a new issue
 * @route POST /api/issues
 * @access Private
 */
const createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      customCategory,
      priority,
      latitude,
      longitude,
      blockNumber,
      apartmentNumber,
      floorNumber,
      area,
      tags
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !priority) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, and priority are required'
      });
    }

    // Validate location
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    // Parse tags
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

    // Handle file uploads
    const images = [];
    const videos = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Convert buffer to base64 for Cloudinary
          const base64Data = file.buffer.toString('base64');
          const dataURI = `data:${file.mimetype};base64,${base64Data}`;
          
          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'issues',
            resource_type: 'auto'
          });

          const mediaItem = {
            url: result.secure_url,
            publicId: result.public_id,
            uploadedAt: new Date()
          };

          if (file.mimetype.startsWith('image/')) {
            images.push(mediaItem);
          } else if (file.mimetype.startsWith('video/')) {
            videos.push(mediaItem);
          }
        } catch (uploadError) {
          logger.error('File upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Error uploading media files'
          });
        }
      }
    }

    // Create issue
    const issue = new Issue({
      title,
      description,
      category,
      customCategory: customCategory || null,
      priority,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      address: {
        blockNumber: blockNumber || null,
        apartmentNumber: apartmentNumber || null,
        floorNumber: floorNumber || null,
        area: area || null
      },
      images,
      videos,
      tags: parsedTags,
      reportedBy: req.user._id
    });

    await issue.save();

    // Log audit event
    await AuditService.logAction(req.user._id, 'ISSUE_CREATED', {
      issueId: issue._id,
      category: issue.category,
      priority: issue.priority,
      hasMedia: images.length > 0 || videos.length > 0
    }, req);

    // Send notification to committee members
    const committeeMembers = await User.find({ role: 'committee' });
    for (const member of committeeMembers) {
      await emailService.sendIssueNotification(member.email, {
        issueId: issue._id,
        title: issue.title,
        category: issue.category,
        priority: issue.priority,
        reportedBy: req.user.name
      });
    }

    logger.info(`Issue created: ${issue._id} by user: ${req.user._id}`);

    res.status(201).json({
      success: true,
      message: 'Issue reported successfully',
      data: {
        issue: await issue.populate('reportedBy', 'name email')
      }
    });

  } catch (error) {
    logger.error('Create issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating issue'
    });
  }
};

/**
 * Get all issues (filtered by user role)
 * @route GET /api/issues
 * @access Private
 */
const getIssues = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter based on user role
    let filter = {};
    
    if (req.user.role === 'resident') {
      filter.reportedBy = req.user._id;
    } else if (req.user.role === 'technician') {
      // Technicians should not access issues directly - they should use assignments
      return res.status(403).json({
        success: false,
        message: 'Technicians should use My Assignments to view their tasks'
      });
    }
    // Committee members will see all issues (no filter applied)

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Issue.countDocuments(filter);

    logger.info(`Issues retrieved: ${issues.length} by user: ${req.user._id}`);

    res.json({
      success: true,
      data: {
        issues,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    logger.error('Get issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving issues'
    });
  }
};

/**
 * Get all issues (for admin/committee members)
 * @route GET /api/issues/admin/all
 * @access Private (Admin/Committee only)
 */
const getAllIssues = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      page = 1,
      limit = 10
    } = req.query;

    // Check if user has admin/committee role
    if (req.user.role !== 'committee' && req.user.role !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Committee access required.'
      });
    }

    // Build filter (no user restriction for admin)
    let filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Issue.countDocuments(filter);

    logger.info(`All issues retrieved: ${issues.length} by admin user: ${req.user._id}`);

    res.json({
      success: true,
      data: {
        issues,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    logger.error('Get all issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving all issues'
    });
  }
};

/**
 * Get issue by ID
 * @route GET /api/issues/:issueId
 * @access Private
 */
const getIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueId)
      .populate('reportedBy', 'name email phoneNumber')
      .populate('assignedTo', 'name email phoneNumber specializations');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Get related assignments
    const assignments = await Assignment.find({ issue: issue._id })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    logger.info(`Issue retrieved: ${issue._id} by user: ${req.user._id}`);

    res.json({
      success: true,
      data: {
        issue,
        assignments
      }
    });

  } catch (error) {
    logger.error('Get issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving issue'
    });
  }
};

/**
 * Update issue
 * @route PUT /api/issues/:issueId
 * @access Private
 */
const updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueId);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Only allow updates if issue is new or user is staff
    if (issue.status !== 'new' && req.user.role === 'resident') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update issue that has been assigned'
      });
    }

    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated directly
    delete updateData.reportedBy;
    delete updateData.assignedTo;
    delete updateData.status;
    delete updateData.images;
    delete updateData.videos;

    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.issueId,
      updateData,
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email');

    // Log audit event
    await AuditService.logAction(req.user._id, 'ISSUE_UPDATED', {
      issueId: issue._id,
      updatedFields: Object.keys(updateData)
    }, req);

    logger.info(`Issue updated: ${issue._id} by user: ${req.user._id}`);

    res.json({
      success: true,
      message: 'Issue updated successfully',
      data: { issue: updatedIssue }
    });

  } catch (error) {
    logger.error('Update issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating issue'
    });
  }
};

/**
 * Delete issue
 * @route DELETE /api/issues/:issueId
 * @access Private (Committee only)
 */
const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueId);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Delete associated media from Cloudinary
    const allMedia = [...issue.images, ...issue.videos];
    for (const media of allMedia) {
      try {
        await cloudinary.uploader.destroy(media.publicId);
      } catch (cloudinaryError) {
        logger.error('Cloudinary deletion error:', cloudinaryError);
      }
    }

    // Delete associated assignments
    await Assignment.deleteMany({ issue: issue._id });

    await Issue.findByIdAndDelete(req.params.issueId);

    // Log audit event
    await AuditService.logAction(req.user._id, 'ISSUE_DELETED', {
      issueId: issue._id,
      category: issue.category,
      priority: issue.priority
    }, req);

    logger.info(`Issue deleted: ${issue._id} by user: ${req.user._id}`);

    res.json({
      success: true,
      message: 'Issue deleted successfully'
    });

  } catch (error) {
    logger.error('Delete issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting issue'
    });
  }
};

/**
 * Assign issue to technician
 * @route POST /api/issues/:issueId/assign
 * @access Private (Committee only)
 */
const assignIssue = async (req, res) => {
  try {
    const { technicianId, estimatedCompletionTime, assignmentNotes } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        success: false,
        message: 'Technician ID is required'
      });
    }

    const issue = await Issue.findById(req.params.issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    const technician = await User.findById(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    // Create assignment
    const assignment = new Assignment({
      issue: issue._id,
      assignedTo: technicianId,
      assignedBy: req.user._id,
      estimatedCompletionTime: estimatedCompletionTime ? new Date(Date.now() + estimatedCompletionTime * 60 * 60 * 1000) : null,
      assignmentNotes: assignmentNotes || null
    });

    await assignment.save();

    // Update issue
    issue.assignedTo = technicianId;
    issue.assignedBy = req.user._id;
    issue.status = 'assigned';
    issue.assignedAt = new Date();
    if (estimatedCompletionTime) {
      issue.estimatedCompletionTime = estimatedCompletionTime;
    }
    await issue.save();

    // Log audit event
    await AuditService.logAction(req.user._id, 'ISSUE_ASSIGNED', {
      issueId: issue._id,
      technicianId: technicianId,
      estimatedTime: estimatedCompletionTime
    }, req);

    // Send notification to technician
    await emailService.sendAssignmentNotification(technician.email, {
      issueId: issue._id,
      title: issue.title,
      category: issue.category,
      priority: issue.priority,
      assignedBy: req.user.name,
      estimatedTime: estimatedCompletionTime
    });

    logger.info(`Issue assigned: ${issue._id} to technician: ${technicianId} by user: ${req.user._id}`);

    res.json({
      success: true,
      message: 'Issue assigned successfully',
      data: {
        assignment: await assignment.populate([
          { path: 'assignedTo', select: 'name email' },
          { path: 'assignedBy', select: 'name email' }
        ]),
        issue: await issue.populate('assignedTo', 'name email')
      }
    });

  } catch (error) {
    logger.error('Assign issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning issue'
    });
  }
};

/**
 * Update issue status
 * @route PUT /api/issues/:issueId/status
 * @access Private
 */
const updateIssueStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const issue = await Issue.findById(req.params.issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    const oldStatus = issue.status;
    await issue.updateStatus(status);

    // Update assignment if exists
    const assignment = await Assignment.findOne({ issue: issue._id });
    if (assignment) {
      switch (status) {
        case 'in_progress':
          await assignment.startWork();
          break;
        case 'resolved':
          await assignment.complete(notes);
          break;
      }
    }

    // Log audit event
    await AuditService.logAction(req.user._id, 'ISSUE_STATUS_UPDATED', {
      issueId: issue._id,
      oldStatus,
      newStatus: status,
      updatedBy: req.user.role
    }, req);

    // Send notification to reporter
    if (status === 'resolved' || status === 'closed') {
      const reporter = await User.findById(issue.reportedBy);
      if (reporter) {
        await emailService.sendIssueResolvedNotification(reporter.email, {
          issueId: issue._id,
          title: issue.title,
          status: status
        });
      }
    }

    logger.info(`Issue status updated: ${issue._id} from ${oldStatus} to ${status} by user: ${req.user._id}`);

    res.json({
      success: true,
      message: 'Issue status updated successfully',
      data: { issue }
    });

  } catch (error) {
    logger.error('Update issue status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating issue status'
    });
  }
};

/**
 * Get available categories
 * @route GET /api/issues/categories
 * @access Public
 */
const getCategories = async (req, res) => {
  try {
    const categories = [
      { value: 'sanitation', label: 'Sanitation' },
      { value: 'security', label: 'Security' },
      { value: 'water', label: 'Water' },
      { value: 'electricity', label: 'Electricity' },
      { value: 'elevator', label: 'Elevator' },
      { value: 'noise', label: 'Noise' },
      { value: 'parking', label: 'Parking' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'cleaning', label: 'Cleaning' },
      { value: 'pest_control', label: 'Pest Control' },
      { value: 'landscaping', label: 'Landscaping' },
      { value: 'fire_safety', label: 'Fire Safety' },
      { value: 'other', label: 'Other' }
    ];

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving categories'
    });
  }
};

/**
 * Get issue analytics
 * @route GET /api/issues/analytics
 * @access Private (Staff only)
 */
const getAnalytics = async (req, res) => {
  try {
    const { period = 'month', category } = req.query;

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
    let filter = { createdAt: { $gte: startDate } };
    if (category) filter.category = category;

    // Get analytics data
    const totalIssues = await Issue.countDocuments(filter);
    const resolvedIssues = await Issue.countDocuments({ ...filter, status: { $in: ['resolved', 'closed'] } });
    const pendingIssues = await Issue.countDocuments({ ...filter, status: { $in: ['new', 'assigned', 'in_progress'] } });

    // Category distribution
    const categoryStats = await Issue.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Priority distribution
    const priorityStats = await Issue.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Status distribution
    const statusStats = await Issue.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Average resolution time
    const resolvedIssuesWithTime = await Issue.find({
      ...filter,
      status: { $in: ['resolved', 'closed'] }
    });

    let totalResolutionTime = 0;
    let validIssuesCount = 0;

    for (const issue of resolvedIssuesWithTime) {
      try {
        // Use updatedAt as fallback if resolvedAt is not set
        let resolvedAt = issue.resolvedAt || issue.updatedAt;
        const createdAt = issue.createdAt;
        
        // If no resolvedAt, use current time as fallback (for demo purposes)
        if (!resolvedAt && issue.status === 'resolved') {
          resolvedAt = new Date();
        }
        
        if (resolvedAt && createdAt) {
          const resolutionTime = (resolvedAt - createdAt) / (1000 * 60 * 60); // in hours
          if (resolutionTime > 0) {
            totalResolutionTime += resolutionTime;
            validIssuesCount++;
          }
        }
      } catch (error) {
        logger.warn(`Error calculating resolution time for issue ${issue._id}:`, error);
      }
    }

    const averageResolutionTime = validIssuesCount > 0 
      ? totalResolutionTime / validIssuesCount 
      : 0;

    logger.info(`Analytics: ${resolvedIssuesWithTime.length} resolved issues, ${validIssuesCount} with valid timestamps, avg time: ${averageResolutionTime.toFixed(2)} hours`);

    res.json({
      success: true,
      data: {
        period,
        totalIssues,
        resolvedIssues,
        pendingIssues,
        resolutionRate: totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 0,
        averageResolutionTime,
        categoryStats,
        priorityStats,
        statusStats
      }
    });

  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics'
    });
  }
};

module.exports = {
  createIssue,
  getIssues,
  getAllIssues,
  getIssue,
  updateIssue,
  deleteIssue,
  assignIssue,
  updateIssueStatus,
  getCategories,
  getAnalytics
}; 