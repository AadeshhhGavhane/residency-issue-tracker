const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  // Issue being rated
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true
  },
  // User providing feedback
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Assignment being rated (optional - for technician-specific feedback)
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    default: null
  },
  // Rating details
  overallRating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  // Detailed ratings
  qualityRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  speedRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  communicationRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  professionalismRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  // Feedback text
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot be more than 500 characters']
  },
  // Feedback categories
  categories: [{
    type: String,
    enum: [
      'excellent_service', 'good_service', 'satisfactory', 'poor_service', 
      'unprofessional', 'delayed_resolution', 'incomplete_work', 'communication_issues',
      'quality_issues', 'cost_concerns', 'safety_concerns', 'cleanliness',
      'punctuality', 'knowledge', 'problem_solving', 'follow_up'
    ]
  }],
  // Anonymous feedback option
  isAnonymous: {
    type: Boolean,
    default: false
  },
  // Feedback status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  // Moderation details
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  moderatedAt: {
    type: Date,
    default: null
  },
  moderationNotes: {
    type: String,
    trim: true,
    maxlength: [200, 'Moderation notes cannot be more than 200 characters']
  },
  // Response from management/technician
  response: {
    text: {
      type: String,
      trim: true,
      maxlength: [300, 'Response cannot be more than 300 characters']
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },
  // Helpful votes
  helpfulVotes: {
    type: Number,
    default: 0,
    min: [0, 'Helpful votes cannot be negative']
  },
  // Report inappropriate content
  reportedCount: {
    type: Number,
    default: 0,
    min: [0, 'Report count cannot be negative']
  },
  // Follow-up feedback
  requiresFollowUp: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date,
    default: null
  },
  followUpCompleted: {
    type: Boolean,
    default: false
  },
  // Language support
  language: {
    type: String,
    enum: ['english', 'hindi', 'marathi'],
    default: 'english'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
feedbackSchema.index({ issue: 1 });
feedbackSchema.index({ user: 1 });
feedbackSchema.index({ assignment: 1 });
feedbackSchema.index({ overallRating: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ createdAt: -1 });

// Virtual for average detailed rating
feedbackSchema.virtual('averageDetailedRating').get(function() {
  const ratings = [
    this.qualityRating,
    this.speedRating,
    this.communicationRating,
    this.professionalismRating
  ].filter(rating => rating !== undefined && rating !== null);
  
  if (ratings.length === 0) return null;
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Virtual for feedback sentiment
feedbackSchema.virtual('sentiment').get(function() {
  if (this.overallRating >= 4) return 'positive';
  if (this.overallRating >= 3) return 'neutral';
  return 'negative';
});

// Method to calculate weighted rating
feedbackSchema.methods.getWeightedRating = function() {
  const detailedRating = this.averageDetailedRating;
  if (!detailedRating) return this.overallRating;
  
  // Weight: 60% overall rating, 40% detailed rating
  return (this.overallRating * 0.6) + (detailedRating * 0.4);
};

// Method to approve feedback
feedbackSchema.methods.approve = function(moderatorId, notes = '') {
  this.status = 'approved';
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationNotes = notes;
  return this.save();
};

// Method to reject feedback
feedbackSchema.methods.reject = function(moderatorId, notes = '') {
  this.status = 'rejected';
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationNotes = notes;
  return this.save();
};

// Method to flag feedback for review
feedbackSchema.methods.flag = function(reason = '') {
  this.status = 'flagged';
  this.moderationNotes = reason;
  return this.save();
};

// Method to add response
feedbackSchema.methods.addResponse = function(text, responderId) {
  this.response = {
    text,
    respondedBy: responderId,
    respondedAt: new Date()
  };
  return this.save();
};

// Method to mark as helpful
feedbackSchema.methods.markHelpful = function() {
  this.helpfulVotes += 1;
  return this.save();
};

// Method to report inappropriate content
feedbackSchema.methods.report = function() {
  this.reportedCount += 1;
  if (this.reportedCount >= 3) {
    this.status = 'flagged';
  }
  return this.save();
};

// Method to get feedback summary
feedbackSchema.methods.getSummary = function() {
  return {
    id: this._id,
    issue: this.issue,
    user: this.isAnonymous ? null : this.user,
    overallRating: this.overallRating,
    averageDetailedRating: this.averageDetailedRating,
    sentiment: this.sentiment,
    comment: this.comment,
    status: this.status,
    createdAt: this.createdAt,
    helpfulVotes: this.helpfulVotes,
    hasResponse: !!this.response.text
  };
};

module.exports = mongoose.model('Feedback', feedbackSchema); 