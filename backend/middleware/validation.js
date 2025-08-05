const logger = require('../config/logger');

// Enhanced validation messages
const validationMessages = {
  name: {
    required: 'Full name is required',
    minLength: 'Name must be at least 2 characters long',
    maxLength: 'Name cannot exceed 50 characters',
    pattern: 'Name can only contain letters, spaces, hyphens, and apostrophes'
  },
  email: {
    required: 'Email address is required',
    invalid: 'Please provide a valid email address',
    duplicate: 'This email is already registered',
    format: 'Email must be in a valid format (e.g., user@example.com)'
  },
  password: {
    required: 'Password is required',
    minLength: 'Password must be at least 8 characters long',
    pattern: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    strength: 'Password is too weak. Please choose a stronger password',
    common: 'This password is too common. Please choose a more unique password'
  },
  profilePicture: {
    size: 'Profile picture must be less than 2MB',
    type: 'Only JPG, PNG, GIF, and WebP images are allowed',
    upload: 'Error uploading profile picture. Please try again.'
  },
  token: {
    required: 'Token is required',
    invalid: 'Invalid token format',
    expired: 'Token has expired'
  }
};

// Common password patterns to avoid
const commonPasswords = [
  'password', '123456', '123456789', 'qwerty', 'abc123',
  'password123', 'admin', 'letmein', 'welcome', 'monkey'
];

// Validation functions
const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return validationMessages.name.required;
  }
  if (name.trim().length < 2) {
    return validationMessages.name.minLength;
  }
  if (name.trim().length > 50) {
    return validationMessages.name.maxLength;
  }
  // Allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
    return validationMessages.name.pattern;
  }
  return null;
};

const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return validationMessages.email.required;
  }
  // More comprehensive email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return validationMessages.email.format;
  }
  // Check for common email issues
  if (email.length > 254) {
    return validationMessages.email.invalid;
  }
  if (email.split('@')[0].length > 64) {
    return validationMessages.email.invalid;
  }
  return null;
};

const validatePassword = (password) => {
  if (!password || password.length === 0) {
    return validationMessages.password.required;
  }
  if (password.length < 8) {
    return validationMessages.password.minLength;
  }
  // Enhanced password strength requirements
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (!passwordRegex.test(password)) {
    return validationMessages.password.pattern;
  }
  // Check for common passwords
  if (commonPasswords.includes(password.toLowerCase())) {
    return validationMessages.password.common;
  }
  return null;
};

const validateFile = (file) => {
  if (!file) return null;
  
  // Check file size (2MB)
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    return validationMessages.profilePicture.size;
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    return validationMessages.profilePicture.type;
  }
  
  return null;
};

const validateToken = (token) => {
  if (!token || token.trim().length === 0) {
    return validationMessages.token.required;
  }
  // Basic token format validation (hex string)
  if (!/^[a-fA-F0-9]+$/.test(token.trim())) {
    return validationMessages.token.invalid;
  }
  if (token.length < 32) {
    return validationMessages.token.invalid;
  }
  return null;
};

// Enhanced validation middleware
const validateRegistration = (req, res, next) => {
  const errors = [];
  
  // Validate name
  const nameError = validateName(req.body.name);
  if (nameError) errors.push(nameError);
  
  // Validate email
  const emailError = validateEmail(req.body.email);
  if (emailError) errors.push(emailError);
  
  // Validate password
  const passwordError = validatePassword(req.body.password);
  if (passwordError) errors.push(passwordError);
  
  // Validate file if present
  if (req.file) {
    const fileError = validateFile(req.file);
    if (fileError) errors.push(fileError);
  }
  
  if (errors.length > 0) {
    logger.warn('Registration validation failed:', {
      errors,
      email: req.body.email,
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      message: errors.length === 1 ? errors[0] : `Validation failed: ${errors.join(', ')}`
    });
  }
  
  next();
};

const validateLogin = (req, res, next) => {
  const errors = [];
  
  // Validate email
  const emailError = validateEmail(req.body.email);
  if (emailError) errors.push(emailError);
  
  // Validate password
  if (!req.body.password || req.body.password.length === 0) {
    errors.push(validationMessages.password.required);
  }
  
  if (errors.length > 0) {
    logger.warn('Login validation failed:', {
      errors,
      email: req.body.email,
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      message: errors.length === 1 ? errors[0] : `Validation failed: ${errors.join(', ')}`
    });
  }
  
  next();
};

const validateProfileUpdate = (req, res, next) => {
  const errors = [];
  
  // Validate name if provided
  if (req.body.name) {
    const nameError = validateName(req.body.name);
    if (nameError) errors.push(nameError);
  }
  
  // Validate file if present
  if (req.file) {
    const fileError = validateFile(req.file);
    if (fileError) errors.push(fileError);
  }
  
  if (errors.length > 0) {
    logger.warn('Profile update validation failed:', {
      errors,
      userId: req.user?.id,
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      message: errors.length === 1 ? errors[0] : `Validation failed: ${errors.join(', ')}`
    });
  }
  
  next();
};

const validatePasswordReset = (req, res, next) => {
  const errors = [];
  
  // Validate email for forgot password
  if (req.body.email) {
    const emailError = validateEmail(req.body.email);
    if (emailError) errors.push(emailError);
  }
  
  // Validate token and new password for reset
  if (req.body.token) {
    const tokenError = validateToken(req.body.token);
    if (tokenError) errors.push(tokenError);
  }
  
  if (req.body.newPassword) {
    const passwordError = validatePassword(req.body.newPassword);
    if (passwordError) errors.push(passwordError);
  }
  
  if (errors.length > 0) {
    logger.warn('Password reset validation failed:', {
      errors,
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      message: errors.length === 1 ? errors[0] : `Validation failed: ${errors.join(', ')}`
    });
  }
  
  next();
};

const validateEmailVerification = (req, res, next) => {
  const errors = [];
  
  // Validate email for resend
  if (req.body.email) {
    const emailError = validateEmail(req.body.email);
    if (emailError) errors.push(emailError);
  }
  
  // Validate token for verification
  if (req.body.token) {
    const tokenError = validateToken(req.body.token);
    if (tokenError) errors.push(tokenError);
  }
  
  if (errors.length > 0) {
    logger.warn('Email verification validation failed:', {
      errors,
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      message: errors.length === 1 ? errors[0] : `Validation failed: ${errors.join(', ')}`
    });
  }
  
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordReset,
  validateEmailVerification,
  validationMessages
}; 