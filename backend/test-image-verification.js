const axios = require('axios');

/**
 * Test script for n8n image verification webhook
 */
const testImageVerification = async () => {
  try {
    console.log('Testing n8n image verification webhook...');
    
    const testData = {
      title: "Water Leaking",
      description: "Water is leaking in my room",
      images: "https://www.roundhayroofing.co.uk/wp-content/uploads/2016/01/roof-leaking-water-damage.jpg"
    };

    console.log('Sending test data:', testData);

    const response = await axios.post('https://hiaa123.app.n8n.cloud/webhook/analyze-image', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('Response status:', response.status);
    console.log('Response data:', response.data);

    if (response.data && response.data.output === 'valid entry') {
      console.log('✅ Image verification test PASSED');
    } else {
      console.log('❌ Image verification test FAILED - Unexpected response');
    }

  } catch (error) {
    console.error('❌ Image verification test FAILED:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Run the test
testImageVerification();
