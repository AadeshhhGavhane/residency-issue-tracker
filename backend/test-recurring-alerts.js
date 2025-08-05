const mongoose = require('mongoose');
const RecurringAlertService = require('./services/recurringAlertService');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function testRecurringAlerts() {
  try {
    console.log('🧪 Testing Recurring Alerts System...\n');

    // Test 1: Get recurring problems for dashboard
    console.log('📊 Test 1: Getting recurring problems for dashboard...');
    const dashboardProblems = await RecurringAlertService.getRecurringProblemsForDashboard();
    console.log('✅ Dashboard problems:', dashboardProblems.length);
    console.log('📋 Problems found:', dashboardProblems);

    // Test 2: Detect recurring problems
    console.log('\n🔍 Test 2: Detecting recurring problems...');
    const detectedProblems = await RecurringAlertService.detectRecurringProblems();
    console.log('✅ Detected problems:', detectedProblems.length);
    
    if (detectedProblems.length > 0) {
      console.log('📋 Problems detected:');
      detectedProblems.forEach((problem, index) => {
        console.log(`  ${index + 1}. ${problem.category} in ${problem.location.blockNumber || problem.location.area}`);
        console.log(`     - Total issues: ${problem.issueCount}`);
        console.log(`     - Recent issues: ${problem.recentIssueCount}`);
        console.log(`     - Total cost: ₹${problem.totalCost}`);
        console.log(`     - Severity: ${problem.recentIssueCount >= 5 ? 'HIGH' : problem.recentIssueCount >= 3 ? 'MEDIUM' : 'LOW'}`);
      });
    } else {
      console.log('✅ No recurring problems detected (this is normal if you have less than 3 similar issues)');
    }

    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testRecurringAlerts(); 