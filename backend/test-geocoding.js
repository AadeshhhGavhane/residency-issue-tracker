const GeocodingService = require('./services/geocodingService');

async function testGeocoding() {
  try {
    console.log('🧪 Testing Geocoding Service...\n');

    // Test 1: Reverse geocoding (coordinates to address)
    console.log('📍 Test 1: Reverse geocoding...');
    const address = await GeocodingService.reverseGeocode(28.6139, 77.2090); // New Delhi coordinates
    console.log('✅ Address:', address);

    // Test 2: Geocoding (address to coordinates)
    console.log('\n🌍 Test 2: Geocoding...');
    const coords = await GeocodingService.geocode('New Delhi, India');
    console.log('✅ Coordinates:', coords);

    // Test 3: Get readable address from location object
    console.log('\n📋 Test 3: Get readable address...');
    const location = {
      lat: 28.6139,
      lng: 77.2090,
      blockNumber: 'A',
      area: 'Ground Floor'
    };
    const readableAddress = await GeocodingService.getReadableAddress(location);
    console.log('✅ Readable address:', readableAddress);

    // Test 4: Get location summary
    console.log('\n📝 Test 4: Get location summary...');
    const summary = await GeocodingService.getLocationSummary(location);
    console.log('✅ Location summary:', summary);

    console.log('\n🎉 All geocoding tests completed successfully!');

  } catch (error) {
    console.error('❌ Geocoding test failed:', error);
  }
}

// Run the test
testGeocoding(); 