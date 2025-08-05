const crypto = require('crypto');

// Generate random token
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate password reset token
const generatePasswordResetToken = () => {
  return generateToken(32);
};

// Generate email verification token
const generateEmailVerificationToken = () => {
  return generateToken(32);
};

// Hash token for storage (similar to password hashing)
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Verify token
const verifyToken = (token, hashedToken) => {
  const hashedInput = hashToken(token);
  return hashedInput === hashedToken;
};

// Check if token is expired
const isTokenExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return new Date() > new Date(expiresAt);
};

// Set password reset token and expiry
const setPasswordResetToken = (user) => {
  const resetToken = generatePasswordResetToken();
  const hashedToken = hashToken(resetToken);
  
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  return resetToken; // Return unhashed token for email
};

// Set email verification token and expiry
const setEmailVerificationToken = (user) => {
  const verificationToken = generateEmailVerificationToken();
  const hashedToken = hashToken(verificationToken);
  
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return verificationToken; // Return unhashed token for email
};

// Clear password reset token
const clearPasswordResetToken = (user) => {
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
};

// Clear email verification token
const clearEmailVerificationToken = (user) => {
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
};

module.exports = {
  generateToken,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  hashToken,
  verifyToken,
  isTokenExpired,
  setPasswordResetToken,
  setEmailVerificationToken,
  clearPasswordResetToken,
  clearEmailVerificationToken
}; 