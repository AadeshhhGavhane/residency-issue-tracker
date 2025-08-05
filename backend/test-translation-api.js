const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testTranslationAPI() {
  try {
    console.log('🧪 Testing Translation API...\n');

    // Test 1: Get supported languages
    console.log('🌍 Test 1: Get supported languages...');
    try {
      const response = await axios.get(`${API_BASE}/translate/languages`);
      console.log('✅ Supported languages:', response.data.data);
    } catch (error) {
      console.log('❌ Failed to get languages:', error.response?.data || error.message);
    }

    // Test 2: Translate text
    console.log('\n🌐 Test 2: Translate text...');
    try {
      const response = await axios.post(`${API_BASE}/translate/text`, {
        text: 'Hello, how are you?',
        targetLanguage: 'hi'
      });
      console.log('✅ Translation result:', response.data.data);
    } catch (error) {
      console.log('❌ Failed to translate text:', error.response?.data || error.message);
    }

    // Test 3: Detect language
    console.log('\n🔍 Test 3: Detect language...');
    try {
      const response = await axios.post(`${API_BASE}/translate/detect`, {
        text: 'नमस्ते दुनिया'
      });
      console.log('✅ Language detection:', response.data.data);
    } catch (error) {
      console.log('❌ Failed to detect language:', error.response?.data || error.message);
    }

    // Test 4: Translate object
    console.log('\n📦 Test 4: Translate object...');
    try {
      const response = await axios.post(`${API_BASE}/translate/object`, {
        object: {
          title: 'Water Leak Issue',
          description: 'There is a water leak in the bathroom',
          category: 'Water'
        },
        targetLanguage: 'hi',
        translatableKeys: ['title', 'description']
      });
      console.log('✅ Object translation:', response.data.data);
    } catch (error) {
      console.log('❌ Failed to translate object:', error.response?.data || error.message);
    }

    console.log('\n🎉 Translation API tests completed!');

  } catch (error) {
    console.error('❌ Translation API test failed:', error);
  }
}

// Run the test
testTranslationAPI(); 