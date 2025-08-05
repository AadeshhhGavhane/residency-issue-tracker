const axios = require('axios');
const logger = require('../config/logger');

// WhatsApp API configuration
const WHATSAPP_API_URL = 'https://gate.whapi.cloud/messages/text';
const WHATSAPP_BEARER_TOKEN = process.env.WHATSAPP_BEARER_TOKEN || '8oQkynOJiH0qletlqdUuXV0CiTozcVGZ';

// Create axios instance for WhatsApp API
const whatsappApi = axios.create({
  baseURL: WHATSAPP_API_URL,
  headers: {
    'accept': 'application/json',
    'authorization': `Bearer ${WHATSAPP_BEARER_TOKEN}`,
    'content-type': 'application/json'
  }
});

// Check if phone number has reached trial limit
const checkPhoneNumberLimit = (phoneNumber) => {
  // List of phone numbers that have reached trial limit
  const limitedNumbers = [
    '919076060075', // Your number
    '9076060075'    // Your number without 91
  ];
  
  const formattedPhone = phoneNumber.replace(/^\+/, '');
  const with91 = formattedPhone.startsWith('91') ? formattedPhone : `91${formattedPhone}`;
  const without91 = formattedPhone.startsWith('91') ? formattedPhone.substring(2) : formattedPhone;
  
  return limitedNumbers.includes(with91) || limitedNumbers.includes(without91);
};

// Send WhatsApp message with trial limit check
const sendWhatsAppMessage = async (body, to) => {
  try {
    // Check if phone number has reached trial limit
    if (checkPhoneNumberLimit(to)) {
      logger.warn('Phone number has reached WhatsApp trial limit', {
        phoneNumber: to,
        message: 'Trial limit reached for this phone number'
      });
      
      return {
        success: false,
        error: 'This phone number has reached the WhatsApp trial limit. Please use email verification or contact support.',
        isTrialLimit: true,
        isPhoneNumberLimit: true
      };
    }

    // Format phone number (remove + if present, ensure it starts with country code)
    let formattedPhone = to.replace(/^\+/, ''); // Remove + if present
    
    // If number doesn't start with country code, assume it's Indian (+91)
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = `91${formattedPhone}`;
    }

    // Log the phone number being sent for debugging
    logger.info('Sending WhatsApp message', {
      originalPhone: to,
      formattedPhone: formattedPhone,
      body: body.substring(0, 50) + '...' // Log first 50 chars of message
    });

    const data = {
      body: body,
      to: formattedPhone
    };

    const response = await whatsappApi.post('', data);
    
    logger.info('WhatsApp message sent successfully', {
      to: formattedPhone,
      messageId: response.data?.id,
      status: response.data?.status
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('WhatsApp message sending failed', {
      to: to,
      error: error.message,
      response: error.response?.data
    });

    // Check if it's a trial limit error
    if (error.response?.status === 402 || error.response?.data?.error?.code === 402) {
      logger.warn('WhatsApp trial limit exceeded. Consider upgrading or using alternative service.');
      return {
        success: false,
        error: 'WhatsApp service trial limit exceeded. Please contact administrator.',
        details: error.response?.data,
        isTrialLimit: true
      };
    }

    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
};

// WhatsApp message templates
const whatsappTemplates = {
  mobileVerification: (verificationToken, userName) => ({
    subject: 'Mobile Verification Link',
    body: `Hello ${userName || 'User'}!

Please verify your mobile number by clicking the link below:

*${process.env.FRONTEND_URL || 'http://localhost:3000'}/mobile-verification?token=${verificationToken}*

This link will expire in 10 minutes for security reasons.

If you didn't request this verification, please ignore this message.

Best regards,
Society Tracker Team`
  }),

  issueNotification: (data) => ({
    subject: `New Issue Reported: ${data.title}`,
    body: `🔔 *New Issue Reported*

*Issue:* ${data.title}
*Category:* ${data.category}
*Priority:* ${data.priority}
*Reported by:* ${data.reportedBy}
*Issue ID:* ${data.issueId}

Please review and assign this issue to an appropriate technician.

Society Tracker Team`
  }),

  assignmentNotification: (data) => ({
    subject: `New Assignment: ${data.title}`,
    body: `🔧 *New Assignment*

You have been assigned a new issue:

*Issue:* ${data.title}
*Category:* ${data.category}
*Priority:* ${data.priority}
*Assigned by:* ${data.assignedBy}
*Estimated time:* ${data.estimatedTime ? `${data.estimatedTime} hours` : 'Not specified'}

Please review the issue details and begin work as soon as possible.

Society Tracker Team`
  }),

  assignmentAcceptedNotification: (data) => ({
    subject: `Assignment Accepted: ${data.title}`,
    body: `✅ *Assignment Accepted*

The following assignment has been accepted:

*Issue:* ${data.title}
*Technician:* ${data.technicianName}
*Status:* Accepted

The technician will begin work on this issue.

Society Tracker Team`
  }),

  assignmentRejectedNotification: (data) => ({
    subject: `Assignment Rejected: ${data.title}`,
    body: `❌ *Assignment Rejected*

The following assignment has been rejected:

*Issue:* ${data.title}
*Technician:* ${data.technicianName}
*Reason:* ${data.reason || 'No reason provided'}

The assignment will be reassigned to another technician.

Society Tracker Team`
  }),

  assignmentStartedNotification: (data) => ({
    subject: `Work Started: ${data.title}`,
    body: `🚀 *Work Started*

The technician has started working on the following assignment:

*Issue:* ${data.title}
*Technician:* ${data.technicianName}
*Status:* In Progress

The work is now in progress. You will be notified when it's completed.

Society Tracker Team`
  }),

  assignmentCompletedNotification: (data) => ({
    subject: `Assignment Completed: ${data.title}`,
    body: `✅ *Assignment Completed*

The following assignment has been completed:

*Issue:* ${data.title}
*Technician:* ${data.technicianName}
*Time spent:* ${data.timeSpent} minutes
*Notes:* ${data.notes || 'No notes provided'}

The issue has been marked as resolved.

Society Tracker Team`
  }),

  issueResolvedNotification: (data) => ({
    subject: `Issue Resolved: ${data.title}`,
    body: `✅ *Issue Resolved*

Your reported issue has been resolved:

*Issue:* ${data.title}
*Status:* ${data.status}

Thank you for reporting this issue. We appreciate your patience.

Society Tracker Team`
  })
};

// Specific WhatsApp functions
const sendMobileVerificationWhatsApp = async (phoneNumber, verificationToken, userName) => {
  const template = whatsappTemplates.mobileVerification(verificationToken, userName);
  return await sendWhatsAppMessage(template.body, phoneNumber);
};

const sendIssueNotificationWhatsApp = async (phoneNumber, data) => {
  const template = whatsappTemplates.issueNotification(data);
  return await sendWhatsAppMessage(template.body, phoneNumber);
};

const sendAssignmentNotificationWhatsApp = async (phoneNumber, data) => {
  const template = whatsappTemplates.assignmentNotification(data);
  return await sendWhatsAppMessage(template.body, phoneNumber);
};

const sendAssignmentAcceptedNotificationWhatsApp = async (phoneNumber, data) => {
  const template = whatsappTemplates.assignmentAcceptedNotification(data);
  return await sendWhatsAppMessage(template.body, phoneNumber);
};

const sendAssignmentRejectedNotificationWhatsApp = async (phoneNumber, data) => {
  const template = whatsappTemplates.assignmentRejectedNotification(data);
  return await sendWhatsAppMessage(template.body, phoneNumber);
};

const sendAssignmentStartedNotificationWhatsApp = async (phoneNumber, data) => {
  const template = whatsappTemplates.assignmentStartedNotification(data);
  return await sendWhatsAppMessage(template.body, phoneNumber);
};

const sendAssignmentCompletedNotificationWhatsApp = async (phoneNumber, data) => {
  const template = whatsappTemplates.assignmentCompletedNotification(data);
  return await sendWhatsAppMessage(template.body, phoneNumber);
};

const sendIssueResolvedNotificationWhatsApp = async (phoneNumber, data) => {
  const template = whatsappTemplates.issueResolvedNotification(data);
  return await sendWhatsAppMessage(template.body, phoneNumber);
};

module.exports = {
  sendWhatsAppMessage,
  sendMobileVerificationWhatsApp,
  sendIssueNotificationWhatsApp,
  sendAssignmentNotificationWhatsApp,
  sendAssignmentAcceptedNotificationWhatsApp,
  sendAssignmentRejectedNotificationWhatsApp,
  sendAssignmentStartedNotificationWhatsApp,
  sendAssignmentCompletedNotificationWhatsApp,
  sendIssueResolvedNotificationWhatsApp
}; 