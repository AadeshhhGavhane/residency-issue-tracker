const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken, setTokenCookie } = require('../middleware/auth');
const { cloudinary } = require('../middleware/upload');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../services/emailService');
const { auditActions } = require('../services/auditService');
const { 
  setPasswordResetToken, 
  setEmailVerificationToken,
  verifyToken, 
  isTokenExpired, 
  clearPasswordResetToken,
  clearEmailVerificationToken
} = require('../utils/tokenUtils');
const logger = require('../config/logger');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'resident', phoneNumber, apartmentNumber, blockNumber, specializations, permissions } = req.body;
    
    // Validation is now handled by middleware
    let profilePictureUrl = null;

    // Handle profile picture upload if provided
    if (req.file) {
      try {
        // Convert buffer to base64 and upload to Cloudinary
        const b64 = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'auth-starter-kit/profiles',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        });

        profilePictureUrl = result.secure_url;
      } catch (error) {
        console.error('Profile picture upload error during registration:', error);
        return res.status(500).json({
          success: false,
          message: 'Error uploading profile picture'
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate role
    const validRoles = ['resident', 'committee', 'technician'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: resident, committee, technician'
      });
    }

    // Create user data object
    const userData = {
      name,
      email,
      password,
      profilePicture: profilePictureUrl,
      isEmailVerified: false, // Email verification required
      role: role || 'resident'
    };

    // Add role-specific fields
    if (phoneNumber) userData.phoneNumber = phoneNumber;
    if (apartmentNumber) userData.apartmentNumber = apartmentNumber;
    if (blockNumber) userData.blockNumber = blockNumber;
    
    // Add technician-specific fields
    if (role === 'technician' && specializations) {
      userData.specializations = Array.isArray(specializations) ? specializations : [specializations];
    }
    
    // Add committee-specific fields
    if (role === 'committee' && permissions) {
      userData.permissions = Array.isArray(permissions) ? permissions : [permissions];
    }

    // Create user
    const user = await User.create(userData);

    // Generate verification token
    const verificationToken = setEmailVerificationToken(user);
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.name);
      await auditActions.logVerificationEmailSent(user._id, user.email, req);
    } catch (emailError) {
      logger.error('Failed to send verification email', {
        email: user.email,
        error: emailError.message
      });
      // Continue with registration even if email fails
    }

    // Log user registration
    await auditActions.logUserRegister(user._id, user.email, req);

    // Log registration success
    logger.info('User registered successfully', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation is now handled by middleware

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Log failed login attempt
      await auditActions.logLoginFailed(email, req, new Error('User not found'));
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Log failed login attempt
      await auditActions.logLoginFailed(email, req, new Error('Invalid password'));
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified (required by default)
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address before logging in. Check your email for a verification link.',
        needsVerification: true
      });
    }

    // Generate token
    const token = generateToken(user._id);
    
    // Set cookie
    setTokenCookie(res, token);

    // Log successful login
    await auditActions.logUserLogin(user._id, user.email, req);

    // Log login success
    logger.info('User logged in successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Clear cookie
    res.clearCookie('token');
    
    // Log logout
    await auditActions.logUserLogout(req.user._id, req.user.email, req);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: { $exists: true },
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Verify token
    if (!verifyToken(token, user.emailVerificationToken)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Check if token is expired
    if (isTokenExpired(user.emailVerificationExpires)) {
      clearEmailVerificationToken(user);
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired'
      });
    }

                // Mark email as verified
            user.isEmailVerified = true;
            clearEmailVerificationToken(user);
            await user.save();

            // Log email verification
            await auditActions.logEmailVerification(user._id, user.email, req);
            
            // Log email verification success
            logger.info('User email verified successfully', {
              userId: user._id,
              email: user.email,
              ip: req.ip
            });

            res.status(200).json({
              success: true,
              message: 'Email verified successfully'
            });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = setEmailVerificationToken(user);
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.name);
      await auditActions.logVerificationEmailSent(user._id, user.email, req);

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (emailError) {
      // Clear token if email fails
      clearEmailVerificationToken(user);
      await user.save();
      
      logger.error('Failed to send verification email', {
        email: user.email,
        error: emailError.message
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = setPasswordResetToken(user);
    await user.save();

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name);
      
      // Log reset request
      await auditActions.logPasswordResetRequest(user._id, user.email, req);
      await auditActions.logResetEmailSent(user._id, user.email, req);

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (emailError) {
      // Clear token if email fails
      clearPasswordResetToken(user);
      await user.save();
      
      logger.error('Failed to send password reset email', {
        email: user.email,
        error: emailError.message
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: { $exists: true },
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Verify token
    if (!verifyToken(token, user.passwordResetToken)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Check if token is expired
    if (isTokenExpired(user.passwordResetExpires)) {
      clearPasswordResetToken(user);
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired'
      });
    }

    // Update password
    user.password = newPassword;
    clearPasswordResetToken(user);
    await user.save();

    // Log password reset
    await auditActions.logPasswordResetComplete(user._id, req);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
}; 