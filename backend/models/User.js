const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false // Don't include password in queries by default
  },
  profilePicture: {
    type: String,
    default: null
  },
  // Role-based fields for issue tracking system
  role: {
    type: String,
    enum: ['resident', 'committee', 'technician'],
    default: 'resident',
    required: true
  },
  // Additional fields for committee members and technicians
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  apartmentNumber: {
    type: String,
    trim: true,
    maxlength: [20, 'Apartment number cannot be more than 20 characters']
  },
  blockNumber: {
    type: String,
    trim: true,
    maxlength: [10, 'Block number cannot be more than 10 characters']
  },
  // For technicians - specialization areas
  specializations: [{
    type: String,
    enum: ['plumbing', 'electrical', 'carpentry', 'cleaning', 'security', 'elevator', 'general']
  }],
  // For committee members - permissions
  permissions: [{
    type: String,
    enum: ['assign_issues', 'view_reports', 'manage_users', 'manage_technicians', 'view_analytics']
  }],
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  // Validate password before hashing
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(this.password)) {
    return next(new Error('Password must contain at least 8 characters with uppercase, lowercase, number, and special character'));
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user data without password
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Method to check if user has specific role
userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

// Method to check if user has permission
userSchema.methods.hasPermission = function(permission) {
  return this.permissions && this.permissions.includes(permission);
};

// Method to check if user is committee member or technician
userSchema.methods.isStaff = function() {
  return this.role === 'committee' || this.role === 'technician';
};

module.exports = mongoose.model('User', userSchema); 