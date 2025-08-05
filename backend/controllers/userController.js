const User = require('../models/User');
const { cloudinary } = require('../middleware/upload');
const { validationResult } = require('express-validator');
const { auditActions } = require('../services/auditService');
const logger = require('../config/logger');

// @desc    Get current user profile
// @route   GET /api/user/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/me
// @access  Private
const updateProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { name } = req.body;
    const updateData = {};

    // Update name if provided
    if (name) {
      updateData.name = name;
    }

    // Email updates are not allowed for security reasons

    // Handle profile picture upload
    if (req.file) {
      try {
        // Delete old profile picture from Cloudinary if it exists
        const user = await User.findById(req.user.id);
        if (user.profilePicture) {
          const publicId = user.profilePicture.split('/').pop().split('.')[0];
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (error) {
            console.error('Error deleting old profile picture:', error);
          }
        }

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

        updateData.profilePicture = result.secure_url;
      } catch (error) {
        console.error('File upload error:', error);
        return res.status(500).json({
          success: false,
          message: 'Error uploading image'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    // Log profile update
    await auditActions.logProfileUpdate(req.user.id, updateData, req);
    
    // Log profile update success
    logger.info('User profile updated successfully', {
      userId: req.user.id,
      email: req.user.email,
      updatedFields: Object.keys(updateData),
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.toJSON()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/user/me
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Delete profile picture from Cloudinary if it exists
    if (user.profilePicture) {
      const publicId = user.profilePicture.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting profile picture:', error);
      }
    }

    // Log account deletion
    await auditActions.logAccountDelete(req.user.id, req);
    
    // Log account deletion success
    logger.info('User account deleted successfully', {
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip
    });

    // Delete user from database
    await User.findByIdAndDelete(req.user.id);

    // Clear cookie
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during account deletion'
    });
  }
};

/**
 * Update user language preference
 * @route PUT /api/user/language
 * @access Private
 */
const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;

    if (!language || !['en', 'hi'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language. Must be "en" or "hi"'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { language },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info(`User language updated: ${req.user.id} -> ${language}`);

    res.json({
      success: true,
      message: 'Language preference updated successfully',
      data: updatedUser
    });

  } catch (error) {
    logger.error('Update language error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating language preference'
    });
  }
};

module.exports = {
  getCurrentUser,
  updateProfile,
  deleteAccount,
  updateLanguage
}; 