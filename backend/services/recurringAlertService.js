const Issue = require('../models/Issue');
const User = require('../models/User');
const emailService = require('./emailService');
const GeocodingService = require('./geocodingService');
const logger = require('../config/logger');

class RecurringAlertService {
  /**
   * Detect recurring problems based on similar titles, categories, and locations
   */
  static async detectRecurringProblems() {
    try {
      logger.info('Starting recurring problem detection...');

      // Get all issues from the last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentIssues = await Issue.find({
        createdAt: { $gte: threeMonthsAgo }
      }).populate('reportedBy', 'name email');

      const recurringProblems = this.analyzeRecurringProblems(recentIssues);

      if (recurringProblems.length > 0) {
        logger.info(`Found ${recurringProblems.length} recurring problems`);
        await this.sendRecurringAlertEmails(recurringProblems);
      } else {
        logger.info('No recurring problems detected');
      }

      return recurringProblems;
    } catch (error) {
      logger.error('Error detecting recurring problems:', error);
      throw error;
    }
  }

  /**
   * Analyze issues to find recurring problems
   */
  static analyzeRecurringProblems(issues) {
    const recurringProblems = [];
    const issueGroups = {};

    // Group issues by category and location
    issues.forEach(issue => {
      const key = `${issue.category}_${issue.address?.blockNumber || 'unknown'}_${issue.address?.area || 'unknown'}`;
      
      if (!issueGroups[key]) {
        issueGroups[key] = {
          category: issue.category,
          location: {
            blockNumber: issue.address?.blockNumber,
            area: issue.address?.area
          },
          issues: [],
          similarTitles: []
        };
      }

      issueGroups[key].issues.push(issue);
      
      // Check for similar titles (basic similarity check)
      const normalizedTitle = issue.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      issueGroups[key].similarTitles.push({
        title: issue.title,
        normalized: normalizedTitle,
        createdAt: issue.createdAt,
        status: issue.status
      });
    });

    // Analyze each group for recurring patterns
    Object.values(issueGroups).forEach(group => {
      if (group.issues.length >= 3) { // At least 3 issues to consider recurring
        const recurringPattern = this.analyzeGroupPattern(group);
        if (recurringPattern) {
          recurringProblems.push(recurringPattern);
        }
      }
    });

    return recurringProblems;
  }

  /**
   * Analyze a group of issues for recurring patterns
   */
  static analyzeGroupPattern(group) {
    const { issues, similarTitles, category, location } = group;
    
    // Check frequency (at least 3 issues in 3 months)
    if (issues.length < 3) return null;

    // Check if issues are recent (within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentIssues = issues.filter(issue => 
      new Date(issue.createdAt) >= thirtyDaysAgo
    );

    if (recentIssues.length < 2) return null; // Need at least 2 recent issues

    // Find most common similar titles
    const titleFrequency = {};
    similarTitles.forEach(item => {
      const words = item.normalized.split(' ').filter(word => word.length > 3);
      words.forEach(word => {
        titleFrequency[word] = (titleFrequency[word] || 0) + 1;
      });
    });

    const commonWords = Object.entries(titleFrequency)
      .filter(([word, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    // Calculate average resolution time
    const resolvedIssues = issues.filter(issue => issue.status === 'resolved' && issue.resolvedAt);
    let avgResolutionTime = 0;
    
    if (resolvedIssues.length > 0) {
      const totalTime = resolvedIssues.reduce((sum, issue) => {
        const created = new Date(issue.createdAt);
        const resolved = new Date(issue.resolvedAt);
        return sum + (resolved.getTime() - created.getTime());
      }, 0);
      avgResolutionTime = totalTime / resolvedIssues.length;
    }

    // Calculate total cost
    const totalCost = issues.reduce((sum, issue) => sum + (issue.cost || 0), 0);

    return {
      category,
      location,
      issueCount: issues.length,
      recentIssueCount: recentIssues.length,
      commonWords,
      avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60 * 60 * 24)), // Convert to days
      totalCost,
      averageCost: totalCost / issues.length,
      lastReported: new Date(Math.max(...issues.map(i => new Date(i.createdAt)))),
      firstReported: new Date(Math.min(...issues.map(i => new Date(i.createdAt)))),
      unresolvedCount: issues.filter(i => i.status !== 'resolved').length,
      issues: issues.slice(-5) // Last 5 issues for reference
    };
  }

  /**
   * Send email alerts for recurring problems
   */
  static async sendRecurringAlertEmails(recurringProblems) {
    try {
      // Get committee members
      const committeeMembers = await User.find({ role: 'committee' });
      
      if (committeeMembers.length === 0) {
        logger.warn('No committee members found for recurring alert emails');
        return;
      }

              for (const problem of recurringProblems) {
          const emailContent = await this.generateRecurringAlertEmail(problem);
        
        for (const member of committeeMembers) {
          try {
            // Use nodemailer directly for custom email
            const nodemailer = require('nodemailer');
            
            // Create transporter using same config as emailService
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
              }
            });
            
            const mailOptions = {
              from: process.env.EMAIL_FROM || 'noreply@residencetracker.com',
              to: member.email,
              subject: `🚨 RECURRING PROBLEM ALERT: ${problem.category} in ${problem.location.blockNumber || problem.location.area}`,
              html: emailContent
            };

            await transporter.sendMail(mailOptions);
            logger.info(`Recurring alert email sent to ${member.email} for ${problem.category} in ${problem.location.blockNumber || problem.location.area}`);
          } catch (error) {
            logger.error(`Failed to send recurring alert email to ${member.email}:`, error);
          }
        }
      }
    } catch (error) {
      logger.error('Error sending recurring alert emails:', error);
      throw error;
    }
  }

  /**
   * Generate email content for recurring problem alert
   */
  static async generateRecurringAlertEmail(problem) {
    const locationText = await GeocodingService.getReadableAddress(problem.location);

    const severityLevel = problem.recentIssueCount >= 5 ? 'HIGH' : 
                         problem.recentIssueCount >= 3 ? 'MEDIUM' : 'LOW';

    const severityColor = severityLevel === 'HIGH' ? '#dc2626' : 
                         severityLevel === 'MEDIUM' ? '#ea580c' : '#ca8a04';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .alert-box { border: 2px solid ${severityColor}; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .metric { display: inline-block; margin: 10px; padding: 10px; background-color: #f3f4f6; border-radius: 5px; }
          .issue-list { background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .recommendation { background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 RECURRING PROBLEM ALERT</h1>
          <p>This issue requires immediate attention from the committee</p>
        </div>
        
        <div class="content">
          <div class="alert-box">
            <h2>Problem Details</h2>
            <p><strong>Category:</strong> ${problem.category}</p>
            <p><strong>Location:</strong> ${locationText}</p>
            <p><strong>Severity Level:</strong> <span style="color: ${severityColor}; font-weight: bold;">${severityLevel}</span></p>
          </div>

          <h3>📊 Statistics</h3>
          <div class="metric">
            <strong>Total Issues:</strong> ${problem.issueCount}
          </div>
          <div class="metric">
            <strong>Recent Issues (30 days):</strong> ${problem.recentIssueCount}
          </div>
          <div class="metric">
            <strong>Unresolved Issues:</strong> ${problem.unresolvedCount}
          </div>
          <div class="metric">
            <strong>Total Cost:</strong> ₹${problem.totalCost.toLocaleString()}
          </div>
          <div class="metric">
            <strong>Average Cost:</strong> ₹${problem.averageCost.toFixed(0)}
          </div>
          <div class="metric">
            <strong>Avg Resolution Time:</strong> ${problem.avgResolutionTime} days
          </div>

          <h3>📅 Timeline</h3>
          <p><strong>First Reported:</strong> ${problem.firstReported.toLocaleDateString()}</p>
          <p><strong>Last Reported:</strong> ${problem.lastReported.toLocaleDateString()}</p>

          ${problem.commonWords.length > 0 ? `
          <h3>🔍 Common Keywords</h3>
          <p>${problem.commonWords.join(', ')}</p>
          ` : ''}

          <h3>📋 Recent Issues</h3>
          <div class="issue-list">
            ${problem.issues.map(issue => `
              <div style="margin-bottom: 10px; padding: 8px; border-left: 3px solid #3b82f6;">
                <strong>${issue.title}</strong><br>
                <small>Status: ${issue.status} | Reported: ${new Date(issue.createdAt).toLocaleDateString()}</small>
              </div>
            `).join('')}
          </div>

          <div class="recommendation">
            <h3>💡 Recommended Actions</h3>
            <ul>
              <li>Schedule a maintenance inspection for ${locationText}</li>
              <li>Review the root cause of recurring ${problem.category} issues</li>
              <li>Consider preventive maintenance measures</li>
              <li>Evaluate if current resolution methods are effective</li>
              <li>Allocate additional budget if needed (₹${problem.totalCost.toLocaleString()} spent so far)</li>
            </ul>
          </div>

          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
            This alert was automatically generated by the Residency Issue Tracker system.
            Please take appropriate action to address this recurring problem.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get recurring problems for dashboard display
   */
  static async getRecurringProblemsForDashboard() {
    try {
      const recurringProblems = await this.detectRecurringProblems();
      
      return await Promise.all(recurringProblems.map(async (problem) => {
        const readableLocation = await GeocodingService.getReadableAddress(problem.location);
        
        return {
          id: `${problem.category}_${problem.location.blockNumber || problem.location.area}`,
          category: problem.category,
          location: {
            ...problem.location,
            readableAddress: readableLocation
          },
          issueCount: problem.issueCount,
          recentIssueCount: problem.recentIssueCount,
          totalCost: problem.totalCost,
          severityLevel: problem.recentIssueCount >= 5 ? 'HIGH' : 
                        problem.recentIssueCount >= 3 ? 'MEDIUM' : 'LOW',
          lastReported: problem.lastReported,
          unresolvedCount: problem.unresolvedCount
        };
      }));
    } catch (error) {
      logger.error('Error getting recurring problems for dashboard:', error);
      return [];
    }
  }
}

module.exports = RecurringAlertService; 