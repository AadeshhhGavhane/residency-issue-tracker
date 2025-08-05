const Feedback = require('../models/Feedback');
const Issue = require('../models/Issue');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const logger = require('../config/logger');

/**
 * Submit feedback for a completed issue
 * @route POST /api/feedback
 * @access Private
 */
const submitFeedback = async (req, res) => {
  try {
    const { issueId, rating, comment } = req.body;

    // Validate required fields
    if (!issueId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Issue ID and rating are required'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    // Check if issue exists and is completed
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    if (issue.status !== 'resolved' && issue.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for completed issues'
      });
    }

    // Check if user has already submitted feedback for this issue
    const existingFeedback = await Feedback.findOne({
      issue: issueId,
      user: req.user._id
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this issue'
      });
    }

    // Check if user is the one who reported the issue
    if (issue.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the person who reported the issue can submit feedback'
      });
    }

    // Create feedback
    const feedback = new Feedback({
      issue: issueId,
      user: req.user._id,
      overallRating: rating,
      comment: comment || '',
      status: 'approved' // Auto-approve for now
    });

    await feedback.save();

    // Update issue with rating using findByIdAndUpdate to ensure it works
    logger.info(`Updating issue ${issueId} with rating: ${rating}, comment: ${comment || 'none'}`);
    
    try {
      const updatedIssue = await Issue.findByIdAndUpdate(
        issueId,
        {
          rating: rating,
          ratingComment: comment || '',
          ratedAt: new Date()
        },
        { new: true, runValidators: true }
      );
      
      if (!updatedIssue) {
        throw new Error('Failed to update issue');
      }
      
      logger.info('Issue updated successfully');
      logger.info(`Updated issue - rating: ${updatedIssue.rating}, comment: ${updatedIssue.ratingComment}, ratedAt: ${updatedIssue.ratedAt}`);
    } catch (updateError) {
      logger.error('Error updating issue:', updateError);
      throw updateError;
    }

    // Update technician rating if issue was assigned
    if (issue.assignedTo) {
      try {
        const technician = await User.findById(issue.assignedTo);
        if (technician && technician.role === 'technician') {
          await technician.updateRating(rating);
          logger.info(`Updated rating for technician ${technician._id}: ${rating} stars`);
        }
      } catch (error) {
        logger.error('Error updating technician rating:', error);
        // Don't fail the feedback submission if rating update fails
      }
    }

    // Log feedback submission (without audit service to avoid errors)
    logger.info(`Feedback submitted for issue ${issueId} with rating ${rating} by user ${req.user._id}`);

    logger.info(`Feedback submitted for issue ${issueId} with rating ${rating}`);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { feedback }
    });

  } catch (error) {
    logger.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback'
    });
  }
};

/**
 * Get feedback for an issue
 * @route GET /api/feedback/issue/:issueId
 * @access Private
 */
const getIssueFeedback = async (req, res) => {
  try {
    const { issueId } = req.params;

    const feedback = await Feedback.findOne({
      issue: issueId,
      user: req.user._id
    });

    res.json({
      success: true,
      data: { feedback }
    });

  } catch (error) {
    logger.error('Get issue feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback'
    });
  }
};

/**
 * Get technician ratings (for committee members)
 * @route GET /api/feedback/technician/:technicianId
 * @access Private (Committee only)
 */
const getTechnicianRatings = async (req, res) => {
  try {
    const { technicianId } = req.params;

    // Check if user is committee member
    if (req.user.role !== 'committee') {
      return res.status(403).json({
        success: false,
        message: 'Only committee members can view technician ratings'
      });
    }

    const technician = await User.findById(technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    if (technician.role !== 'technician') {
      return res.status(400).json({
        success: false,
        message: 'User is not a technician'
      });
    }

    // Get recent feedback for this technician
    const recentFeedback = await Feedback.find({
      issue: { $in: await Issue.find({ assignedTo: technicianId }).distinct('_id') }
    })
    .populate('issue', 'title category')
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

    const ratingSummary = technician.getRatingSummary();

    res.json({
      success: true,
      data: {
        technician: {
          _id: technician._id,
          name: technician.name,
          specializations: technician.specializations,
          ratingSummary
        },
        recentFeedback
      }
    });

  } catch (error) {
    logger.error('Get technician ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching technician ratings'
    });
  }
};

/**
 * Get all technician ratings (for committee dashboard)
 * @route GET /api/feedback/technicians
 * @access Private (Committee only)
 */
const getAllTechnicianRatings = async (req, res) => {
  try {
    // Check if user is committee member
    if (req.user.role !== 'committee') {
      return res.status(403).json({
        success: false,
        message: 'Only committee members can view technician ratings'
      });
    }

    const technicians = await User.find({ role: 'technician' })
      .select('name specializations feedbacks rating')
      .sort({ rating: -1 });

    const techniciansWithRatings = technicians.map(technician => ({
      ...technician.toObject(),
      ratingSummary: technician.getRatingSummary()
    }));

    res.json({
      success: true,
      data: { technicians: techniciansWithRatings }
    });

  } catch (error) {
    logger.error('Get all technician ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching technician ratings'
    });
  }
};

module.exports = {
  submitFeedback,
  getIssueFeedback,
  getTechnicianRatings,
  getAllTechnicianRatings
}; 