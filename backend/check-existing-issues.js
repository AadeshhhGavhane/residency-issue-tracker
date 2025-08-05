const mongoose = require('mongoose');
const Issue = require('./models/Issue');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function checkExistingIssues() {
  try {
    console.log('🔍 Checking existing issues in database...\n');

    const issues = await Issue.find({}).populate('reportedBy', 'name email');
    
    console.log(`📊 Total issues found: ${issues.length}\n`);

    // Group by category
    const issuesByCategory = {};
    issues.forEach(issue => {
      if (!issuesByCategory[issue.category]) {
        issuesByCategory[issue.category] = [];
      }
      issuesByCategory[issue.category].push(issue);
    });

    console.log('📋 Issues by category:');
    Object.entries(issuesByCategory).forEach(([category, categoryIssues]) => {
      console.log(`\n${category}: ${categoryIssues.length} issues`);
      
      categoryIssues.forEach((issue, index) => {
        const address = issue.address ? 
          `Block ${issue.address.blockNumber || 'N/A'}, ${issue.address.area || 'N/A'}` : 
          'No address';
        
        console.log(`  ${index + 1}. ${issue.title}`);
        console.log(`     Status: ${issue.status}`);
        console.log(`     Address: ${address}`);
        console.log(`     Created: ${new Date(issue.createdAt).toLocaleDateString()}`);
        console.log(`     Cost: ₹${issue.cost || 0}`);
      });
    });

    // Check for issues with missing address
    const issuesWithoutAddress = issues.filter(issue => 
      !issue.address || 
      (!issue.address.blockNumber && !issue.address.area)
    );

    if (issuesWithoutAddress.length > 0) {
      console.log(`\n⚠️  Issues without proper address: ${issuesWithoutAddress.length}`);
      issuesWithoutAddress.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.title} (${issue.category})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking issues:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkExistingIssues(); 