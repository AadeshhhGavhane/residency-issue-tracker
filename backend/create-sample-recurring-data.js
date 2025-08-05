const mongoose = require('mongoose');
const Issue = require('./models/Issue');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function createSampleRecurringData() {
  try {
    console.log('🔧 Creating sample recurring issue data...\n');

    // Get a sample user for reporting
    const sampleUser = await User.findOne({ role: 'resident' });
    if (!sampleUser) {
      console.log('❌ No resident user found. Please create a resident user first.');
      return;
    }

    // Sample recurring issues data
    const sampleIssues = [
      // Water issues in Block A (recurring)
      {
        title: 'Water Leak in Block A',
        description: 'Water leaking from ceiling in Block A',
        category: 'Water',
        priority: 'medium',
        status: 'resolved',
        address: { blockNumber: 'A', area: 'Ground Floor' },
        reportedBy: sampleUser._id,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        resolvedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        cost: 500
      },
      {
        title: 'Water Leak in Block A',
        description: 'Water leaking from ceiling in Block A again',
        category: 'Water',
        priority: 'medium',
        status: 'resolved',
        address: { blockNumber: 'A', area: 'Ground Floor' },
        reportedBy: sampleUser._id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        cost: 300
      },
      {
        title: 'Water Leak in Block A',
        description: 'Water leaking from ceiling in Block A - third time',
        category: 'Water',
        priority: 'high',
        status: 'in_progress',
        address: { blockNumber: 'A', area: 'Ground Floor' },
        reportedBy: sampleUser._id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        cost: 0
      },
      // Electrical issues in Block B (recurring)
      {
        title: 'Electrical Problem in Block B',
        description: 'Power outage in Block B',
        category: 'Electricity',
        priority: 'high',
        status: 'resolved',
        address: { blockNumber: 'B', area: 'First Floor' },
        reportedBy: sampleUser._id,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        resolvedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        cost: 800
      },
      {
        title: 'Electrical Problem in Block B',
        description: 'Power outage in Block B again',
        category: 'Electricity',
        priority: 'high',
        status: 'resolved',
        address: { blockNumber: 'B', area: 'First Floor' },
        reportedBy: sampleUser._id,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        resolvedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        cost: 600
      },
      {
        title: 'Electrical Problem in Block B',
        description: 'Power outage in Block B - third occurrence',
        category: 'Electricity',
        priority: 'urgent',
        status: 'assigned',
        address: { blockNumber: 'B', area: 'First Floor' },
        reportedBy: sampleUser._id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        cost: 0
      },
      // Plumbing issues in Block C (recurring)
      {
        title: 'Plumbing Issue in Block C',
        description: 'Clogged drain in Block C',
        category: 'Plumbing',
        priority: 'medium',
        status: 'resolved',
        address: { blockNumber: 'C', area: 'Second Floor' },
        reportedBy: sampleUser._id,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        resolvedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
        cost: 400
      },
      {
        title: 'Plumbing Issue in Block C',
        description: 'Clogged drain in Block C again',
        category: 'Plumbing',
        priority: 'medium',
        status: 'resolved',
        address: { blockNumber: 'C', area: 'Second Floor' },
        reportedBy: sampleUser._id,
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        resolvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        cost: 350
      },
      {
        title: 'Plumbing Issue in Block C',
        description: 'Clogged drain in Block C - third time',
        category: 'Plumbing',
        priority: 'high',
        status: 'new',
        address: { blockNumber: 'C', area: 'Second Floor' },
        reportedBy: sampleUser._id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        cost: 0
      },
      // Pest control in Block D (recurring)
      {
        title: 'Pest Control Needed in Block D',
        description: 'Rats in Block D',
        category: 'Pest Control',
        priority: 'medium',
        status: 'resolved',
        address: { blockNumber: 'D', area: 'Basement' },
        reportedBy: sampleUser._id,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        resolvedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), // 22 days ago
        cost: 1200
      },
      {
        title: 'Pest Control Needed in Block D',
        description: 'Rats in Block D again',
        category: 'Pest Control',
        priority: 'medium',
        status: 'resolved',
        address: { blockNumber: 'D', area: 'Basement' },
        reportedBy: sampleUser._id,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        resolvedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        cost: 1000
      },
      {
        title: 'Pest Control Needed in Block D',
        description: 'Rats in Block D - third occurrence',
        category: 'Pest Control',
        priority: 'high',
        status: 'assigned',
        address: { blockNumber: 'D', area: 'Basement' },
        reportedBy: sampleUser._id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        cost: 0
      },
      {
        title: 'Pest Control Needed in Block D',
        description: 'Rats in Block D - fourth occurrence',
        category: 'Pest Control',
        priority: 'high',
        status: 'new',
        address: { blockNumber: 'D', area: 'Basement' },
        reportedBy: sampleUser._id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        cost: 0
      }
    ];

    // Create the sample issues
    console.log('📝 Creating sample issues...');
    const createdIssues = await Issue.insertMany(sampleIssues);
    console.log(`✅ Created ${createdIssues.length} sample issues`);

    console.log('\n📊 Sample data summary:');
    console.log('- Water issues in Block A: 3 issues (recurring)');
    console.log('- Electrical issues in Block B: 3 issues (recurring)');
    console.log('- Plumbing issues in Block C: 3 issues (recurring)');
    console.log('- Pest control in Block D: 4 issues (recurring)');

    console.log('\n🎯 Now you can test the recurring alerts system!');
    console.log('Run: node test-recurring-alerts.js');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
createSampleRecurringData(); 