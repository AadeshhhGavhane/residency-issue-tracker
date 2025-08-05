const RecurringAlertService = require('../services/recurringAlertService');
const logger = require('../config/logger');

/**
 * Get recurring problems for dashboard display
 */
const getRecurringProblems = async (req, res) => {
  try {
    logger.info('Getting recurring problems for dashboard');
    
    const recurringProblems = await RecurringAlertService.getRecurringProblemsForDashboard();
    
    res.json({
      success: true,
      data: {
        recurringProblems,
        totalCount: recurringProblems.length,
        highSeverityCount: recurringProblems.filter(p => p.severityLevel === 'HIGH').length,
        mediumSeverityCount: recurringProblems.filter(p => p.severityLevel === 'MEDIUM').length,
        lowSeverityCount: recurringProblems.filter(p => p.severityLevel === 'LOW').length
      }
    });
  } catch (error) {
    logger.error('Error getting recurring problems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recurring problems',
      error: error.message
    });
  }
};

/**
 * Manually trigger recurring problem detection and email alerts
 */
const triggerRecurringDetection = async (req, res) => {
  try {
    logger.info('Manually triggering recurring problem detection');
    
    const recurringProblems = await RecurringAlertService.detectRecurringProblems();
    
    res.json({
      success: true,
      message: `Recurring problem detection completed. Found ${recurringProblems.length} recurring problems.`,
      data: {
        detectedProblems: recurringProblems.length,
        problems: recurringProblems.map(problem => ({
          category: problem.category,
          location: problem.location,
          issueCount: problem.issueCount,
          recentIssueCount: problem.recentIssueCount,
          severityLevel: problem.recentIssueCount >= 5 ? 'HIGH' : 
                        problem.recentIssueCount >= 3 ? 'MEDIUM' : 'LOW'
        }))
      }
    });
  } catch (error) {
    logger.error('Error triggering recurring problem detection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger recurring problem detection',
      error: error.message
    });
  }
};

module.exports = {
  getRecurringProblems,
  triggerRecurringDetection
}; 