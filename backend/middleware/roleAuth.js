const User = require('../models/User');

/**
 * Middleware to check if user has specific role
 * @param {string|Array} roles - Role(s) allowed to access the route
 * @returns {Function} Express middleware function
 */
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Convert single role to array for consistent handling
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Role authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during role verification'
      });
    }
  };
};

/**
 * Middleware to check if user has specific permission
 * @param {string|Array} permissions - Permission(s) required
 * @returns {Function} Express middleware function
 */
const requirePermission = (permissions) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Convert single permission to array for consistent handling
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

      // Check if user has required permissions
      const hasAllPermissions = requiredPermissions.every(permission => 
        req.user.hasPermission(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission(s): ${requiredPermissions.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during permission verification'
      });
    }
  };
};

/**
 * Middleware to check if user is staff (committee or technician)
 * @returns {Function} Express middleware function
 */
const requireStaff = () => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user is staff
      if (!req.user.isStaff()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Staff privileges required'
        });
      }

      next();
    } catch (error) {
      console.error('Staff authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during staff verification'
      });
    }
  };
};

/**
 * Middleware to check if user can access/modify specific issue
 * @param {string} accessType - 'read', 'update', 'delete', 'assign'
 * @returns {Function} Express middleware function
 */
const requireIssueAccess = (accessType = 'read') => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const issueId = req.params.issueId || req.body.issueId;
      if (!issueId) {
        return res.status(400).json({
          success: false,
          message: 'Issue ID is required'
        });
      }

      // Import Issue model here to avoid circular dependency
      const Issue = require('../models/Issue');
      
      const issue = await Issue.findById(issueId).populate('reportedBy assignedTo');
      if (!issue) {
        return res.status(404).json({
          success: false,
          message: 'Issue not found'
        });
      }

      // Check access based on user role and issue ownership
      let hasAccess = false;

      switch (accessType) {
        case 'read':
          // Residents can read their own issues, staff can read all
          hasAccess = req.user.role === 'resident' 
            ? issue.reportedBy._id.toString() === req.user._id.toString()
            : req.user.isStaff();
          break;

        case 'update':
          // Residents can update their own issues if not assigned, staff can update all
          hasAccess = req.user.role === 'resident'
            ? issue.reportedBy._id.toString() === req.user._id.toString() && issue.status === 'new'
            : req.user.isStaff();
          break;

        case 'delete':
          // Only committee members can delete issues
          hasAccess = req.user.role === 'committee';
          break;

        case 'assign':
          // Only committee members can assign issues
          hasAccess = req.user.role === 'committee';
          break;

        default:
          hasAccess = false;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You don't have permission to ${accessType} this issue`
        });
      }

      // Add issue to request object for use in controllers
      req.issue = issue;
      next();
    } catch (error) {
      console.error('Issue access authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during issue access verification'
      });
    }
  };
};

/**
 * Middleware to check if user can access/modify specific assignment
 * @param {string} accessType - 'read', 'update', 'complete'
 * @returns {Function} Express middleware function
 */
const requireAssignmentAccess = (accessType = 'read') => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const assignmentId = req.params.assignmentId || req.body.assignmentId;
      if (!assignmentId) {
        return res.status(400).json({
          success: false,
          message: 'Assignment ID is required'
        });
      }

      // Import Assignment model here to avoid circular dependency
      const Assignment = require('../models/Assignment');
      
      const assignment = await Assignment.findById(assignmentId)
        .populate('issue assignedTo assignedBy');
      
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Check access based on user role and assignment
      let hasAccess = false;

      switch (accessType) {
        case 'read':
          // Technicians can read their assignments, committee can read all
          hasAccess = req.user.role === 'technician'
            ? assignment.assignedTo._id.toString() === req.user._id.toString()
            : req.user.role === 'committee';
          break;

        case 'update':
          // Technicians can update their assignments, committee can update all
          hasAccess = req.user.role === 'technician'
            ? assignment.assignedTo._id.toString() === req.user._id.toString()
            : req.user.role === 'committee';
          break;

        case 'complete':
          // Only assigned technician can complete assignment
          hasAccess = assignment.assignedTo._id.toString() === req.user._id.toString();
          break;

        default:
          hasAccess = false;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You don't have permission to ${accessType} this assignment`
        });
      }

      // Add assignment to request object for use in controllers
      req.assignment = assignment;
      next();
    } catch (error) {
      console.error('Assignment access authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during assignment access verification'
      });
    }
  };
};

module.exports = {
  requireRole,
  requirePermission,
  requireStaff,
  requireIssueAccess,
  requireAssignmentAccess
}; 