const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  // Issue being assigned
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true
  },
  // Assignment details
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Assignment metadata
  assignedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  estimatedStartTime: {
    type: Date,
    default: null
  },
  estimatedCompletionTime: {
    type: Date,
    default: null
  },
  actualStartTime: {
    type: Date,
    default: null
  },
  actualCompletionTime: {
    type: Date,
    default: null
  },
  // Assignment status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'rejected'],
    default: 'pending',
    required: true
  },
  // Priority and urgency
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    required: true
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  // Assignment notes
  assignmentNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Assignment notes cannot be more than 500 characters']
  },
  // Payment amount for technician
  paymentAmount: {
    type: Number,
    min: [0, 'Payment amount cannot be negative'],
    default: 0
  },
  technicianNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Technician notes cannot be more than 500 characters']
  },
  // Rejection details
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Rejection reason cannot be more than 200 characters']
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  // Completion details
  completionNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Completion notes cannot be more than 500 characters']
  },
  materialsUsed: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Material name cannot be more than 50 characters']
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative']
    },
    unit: {
      type: String,
      trim: true,
      maxlength: [20, 'Unit cannot be more than 20 characters']
    },
    cost: {
      type: Number,
      min: [0, 'Cost cannot be negative'],
      default: 0
    }
  }],
  // Time tracking
  timeSpent: {
    type: Number, // in minutes
    min: [0, 'Time spent cannot be negative'],
    default: 0
  },
  // Quality metrics
  qualityRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  // Follow-up assignments
  requiresFollowUp: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date,
    default: null
  },
  followUpNotes: {
    type: String,
    trim: true,
    maxlength: [300, 'Follow-up notes cannot be more than 300 characters']
  },
  // Related assignments (for complex issues)
  relatedAssignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
assignmentSchema.index({ issue: 1 });
assignmentSchema.index({ assignedTo: 1 });
assignmentSchema.index({ assignedBy: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ assignedAt: -1 });
assignmentSchema.index({ estimatedCompletionTime: 1 });

// Composite indexes for common query patterns
assignmentSchema.index({ assignedTo: 1, status: 1 });
assignmentSchema.index({ status: 1, assignedAt: -1 });
assignmentSchema.index({ assignedBy: 1, assignedAt: -1 });
assignmentSchema.index({ issue: 1, status: 1 });

// Index for payment analytics
assignmentSchema.index({ paymentAmount: 1, status: 1 });
assignmentSchema.index({ paymentAmount: 1, assignedAt: -1 });

// Index for technician dashboard queries
assignmentSchema.index({ assignedTo: 1, status: 1, assignedAt: -1 });
assignmentSchema.index({ assignedTo: 1, priority: 1, status: 1 });

// Virtual for assignment duration
assignmentSchema.virtual('duration').get(function() {
  if (!this.actualStartTime || !this.actualCompletionTime) return null;
  return (this.actualCompletionTime - this.actualStartTime) / (1000 * 60); // in minutes
});

// Virtual for estimated duration
assignmentSchema.virtual('estimatedDuration').get(function() {
  if (!this.estimatedStartTime || !this.estimatedCompletionTime) return null;
  return (this.estimatedCompletionTime - this.estimatedStartTime) / (1000 * 60); // in minutes
});

// Method to accept assignment
assignmentSchema.methods.accept = function() {
  this.status = 'accepted';
  this.actualStartTime = new Date();
  return this.save();
};

// Method to start work
assignmentSchema.methods.startWork = function() {
  this.status = 'in_progress';
  if (!this.actualStartTime) {
    this.actualStartTime = new Date();
  }
  return this.save();
};

// Method to complete assignment
assignmentSchema.methods.complete = function(notes = '') {
  this.status = 'completed';
  this.actualCompletionTime = new Date();
  this.completionNotes = notes;
  return this.save();
};

// Method to reject assignment
assignmentSchema.methods.reject = function(reason) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.rejectedAt = new Date();
  return this.save();
};

// Method to check if assignment is overdue
assignmentSchema.methods.isOverdue = function() {
  if (this.status === 'completed' || this.status === 'rejected') return false;
  if (!this.estimatedCompletionTime) return false;
  
  const now = new Date();
  return now > this.estimatedCompletionTime;
};

// Method to calculate efficiency
assignmentSchema.methods.getEfficiency = function() {
  if (!this.estimatedDuration || !this.duration) return null;
  return (this.estimatedDuration / this.duration) * 100; // percentage
};

// Method to get assignment summary
assignmentSchema.methods.getSummary = function() {
  return {
    id: this._id,
    issue: this.issue,
    assignedTo: this.assignedTo,
    assignedBy: this.assignedBy,
    status: this.status,
    priority: this.priority,
    assignedAt: this.assignedAt,
    estimatedCompletionTime: this.estimatedCompletionTime,
    isOverdue: this.isOverdue(),
    timeSpent: this.timeSpent,
    qualityRating: this.qualityRating,
    paymentAmount: this.paymentAmount
  };
};

module.exports = mongoose.model('Assignment', assignmentSchema); 