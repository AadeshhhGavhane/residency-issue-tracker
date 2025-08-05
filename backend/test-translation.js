const translationService = require('./services/translationService');

async function testTranslation() {
  try {
    console.log('🧪 Testing Translation Service...\n');

    // Test 1: Translate text to Hindi
    console.log('🌐 Test 1: Translate text to Hindi...');
    const englishText = 'Hello, how are you?';
    const hindiTranslation = await translationService.translateText(englishText, 'hi');
    console.log('✅ English -> Hindi:', englishText, '->', hindiTranslation);

    // Test 2: Translate text to English
    console.log('\n🌐 Test 2: Translate text to English...');
    const hindiText = 'नमस्ते, आप कैसे हैं?';
    const englishTranslation = await translationService.translateText(hindiText, 'en');
    console.log('✅ Hindi -> English:', hindiText, '->', englishTranslation);

    // Test 3: Translate object
    console.log('\n📦 Test 3: Translate object...');
    const testObject = {
      title: 'Water Leak Issue',
      description: 'There is a water leak in the bathroom',
      category: 'Water',
      status: 'new'
    };
    const translatedObject = await translationService.translateObject(
      testObject, 
      'hi', 
      ['title', 'description']
    );
    console.log('✅ Object translation:', translatedObject);

    // Test 4: Get supported languages
    console.log('\n🌍 Test 4: Get supported languages...');
    const languages = await translationService.getSupportedLanguages();
    console.log('✅ Supported languages:', languages.slice(0, 5)); // Show first 5

    // Test 5: Detect language
    console.log('\n🔍 Test 5: Detect language...');
    const detectedLanguage = await translationService.detectLanguage('नमस्ते दुनिया');
    console.log('✅ Detected language:', detectedLanguage);

    // Test 6: Cache statistics
    console.log('\n📊 Test 6: Cache statistics...');
    const cacheStats = translationService.getCacheStats();
    console.log('✅ Cache stats:', cacheStats);

    console.log('\n🎉 All translation tests completed successfully!');

  } catch (error) {
    console.error('❌ Translation test failed:', error);
  }
}

// Run the test
testTranslation(); 