const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  // Basic issue information
  title: {
    type: String,
    required: [true, 'Issue title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Issue description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  // Category and priority
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'sanitation', 'security', 'water', 'electricity', 'elevator', 
      'noise', 'parking', 'maintenance', 'cleaning', 'pest_control',
      'landscaping', 'fire_safety', 'other'
    ],
    default: 'other'
  },
  customCategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Custom category cannot be more than 50 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    required: true
  },
  // Status tracking
  status: {
    type: String,
    enum: ['new', 'assigned', 'in_progress', 'resolved', 'closed'],
    default: 'new',
    required: true
  },
  // Location information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    blockNumber: {
      type: String,
      trim: true,
      maxlength: [10, 'Block number cannot be more than 10 characters']
    },
    apartmentNumber: {
      type: String,
      trim: true,
      maxlength: [20, 'Apartment number cannot be more than 20 characters']
    },
    floorNumber: {
      type: String,
      trim: true,
      maxlength: [5, 'Floor number cannot be more than 5 characters']
    },
    area: {
      type: String,
      trim: true,
      maxlength: [100, 'Area description cannot be more than 100 characters']
    }
  },
  // Media attachments
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  videos: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // User relationships
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Timestamps for tracking
  assignedAt: {
    type: Date,
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  // Additional metadata
  estimatedCompletionTime: {
    type: Number, // in hours
    min: [0, 'Estimated time cannot be negative']
  },
  actualCompletionTime: {
    type: Number, // in hours
    min: [0, 'Actual time cannot be negative']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative'],
    default: 0
  },
  // Internal notes
  internalNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Internal notes cannot be more than 500 characters']
  },
  // Tags for better organization
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot be more than 20 characters']
  }],
  // Recurring issue tracking
  isRecurring: {
    type: Boolean,
    default: false
  },
  relatedIssues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
issueSchema.index({ status: 1, priority: 1 });
issueSchema.index({ category: 1 });
issueSchema.index({ reportedBy: 1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ location: '2dsphere' }); // For geospatial queries

// Virtual for full category name
issueSchema.virtual('fullCategory').get(function() {
  return this.customCategory || this.category;
});

// Method to update status with timestamp
issueSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  switch(newStatus) {
    case 'assigned':
      this.assignedAt = new Date();
      break;
    case 'in_progress':
      this.startedAt = new Date();
      break;
    case 'resolved':
      this.resolvedAt = new Date();
      break;
    case 'closed':
      this.closedAt = new Date();
      break;
  }
  
  return this.save();
};

// Method to calculate resolution time
issueSchema.methods.getResolutionTime = function() {
  if (!this.resolvedAt || !this.createdAt) return null;
  return (this.resolvedAt - this.createdAt) / (1000 * 60 * 60); // in hours
};

// Method to check if issue is overdue
issueSchema.methods.isOverdue = function() {
  if (this.status === 'resolved' || this.status === 'closed') return false;
  if (!this.estimatedCompletionTime || !this.assignedAt) return false;
  
  const now = new Date();
  const estimatedEnd = new Date(this.assignedAt.getTime() + (this.estimatedCompletionTime * 60 * 60 * 1000));
  return now > estimatedEnd;
};

// Method to get issue summary
issueSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    category: this.fullCategory,
    priority: this.priority,
    status: this.status,
    reportedBy: this.reportedBy,
    assignedTo: this.assignedTo,
    createdAt: this.createdAt,
    location: this.location,
    isOverdue: this.isOverdue()
  };
};

module.exports = mongoose.model('Issue', issueSchema); 