const axios = require('axios');
const fs = require('fs');

// Performance test configuration
const config = {
  baseURL: 'http://localhost:5000/api',
  endpoints: [
    '/issues',
    '/issues/admin/all',
    '/issues/analytics',
    '/assignments',
    '/assignments/analytics'
  ],
  iterations: 10,
  concurrent: 5
};

// Performance metrics
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  averageResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  cacheHitRate: 0
};

// Test a single endpoint
async function testEndpoint(endpoint, authToken = null) {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${config.baseURL}${endpoint}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      timeout: 10000
    });
    
    const responseTime = Date.now() - startTime;
    
    metrics.totalRequests++;
    metrics.successfulRequests++;
    metrics.responseTimes.push(responseTime);
    metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
    metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
    
    // Check if response was cached
    const wasCached = response.headers['x-cache'] === 'HIT';
    if (wasCached) {
      metrics.cacheHitRate++;
    }
    
    return {
      success: true,
      responseTime,
      wasCached,
      status: response.status
    };
  } catch (error) {
    metrics.totalRequests++;
    metrics.failedRequests++;
    
    return {
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

// Run performance tests
async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests...\n');
  
  const results = [];
  
  for (const endpoint of config.endpoints) {
    console.log(`Testing endpoint: ${endpoint}`);
    
    const endpointResults = [];
    
    // Test with different concurrency levels
    for (let concurrent = 1; concurrent <= config.concurrent; concurrent++) {
      const promises = [];
      
      for (let i = 0; i < config.iterations; i++) {
        promises.push(testEndpoint(endpoint));
      }
      
      const startTime = Date.now();
      const batchResults = await Promise.all(promises);
      const batchTime = Date.now() - startTime;
      
      const successful = batchResults.filter(r => r.success).length;
      const averageTime = batchResults.reduce((sum, r) => sum + r.responseTime, 0) / batchResults.length;
      
      endpointResults.push({
        concurrent,
        successful,
        total: batchResults.length,
        averageTime,
        batchTime,
        results: batchResults
      });
      
      console.log(`  Concurrent ${concurrent}: ${successful}/${batchResults.length} successful, avg: ${averageTime.toFixed(2)}ms`);
    }
    
    results.push({
      endpoint,
      results: endpointResults
    });
  }
  
  // Calculate overall metrics
  metrics.averageResponseTime = metrics.responseTimes.reduce((sum, time) => sum + time, 0) / metrics.responseTimes.length;
  metrics.cacheHitRate = (metrics.cacheHitRate / metrics.successfulRequests) * 100;
  
  // Generate report
  generateReport(results);
}

// Generate performance report
function generateReport(results) {
  console.log('\n📊 Performance Test Results\n');
  console.log('='.repeat(50));
  
  console.log(`Total Requests: ${metrics.totalRequests}`);
  console.log(`Successful: ${metrics.successfulRequests}`);
  console.log(`Failed: ${metrics.failedRequests}`);
  console.log(`Success Rate: ${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%`);
  console.log(`Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);
  console.log(`Min Response Time: ${metrics.minResponseTime}ms`);
  console.log(`Max Response Time: ${metrics.maxResponseTime}ms`);
  console.log(`Cache Hit Rate: ${metrics.cacheHitRate.toFixed(2)}%`);
  
  console.log('\n📈 Endpoint Performance:');
  console.log('='.repeat(50));
  
  results.forEach(({ endpoint, results: endpointResults }) => {
    console.log(`\n${endpoint}:`);
    endpointResults.forEach(({ concurrent, successful, total, averageTime, batchTime }) => {
      console.log(`  Concurrent ${concurrent}: ${successful}/${total} (${averageTime.toFixed(2)}ms avg, ${batchTime}ms total)`);
    });
  });
  
  // Save detailed results to file
  const reportData = {
    timestamp: new Date().toISOString(),
    metrics,
    results
  };
  
  fs.writeFileSync('performance-test-results.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detailed results saved to: performance-test-results.json');
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  console.log('='.repeat(50));
  
  if (metrics.averageResponseTime > 500) {
    console.log('⚠️  Average response time is above 500ms - consider optimizing database queries');
  } else {
    console.log('✅ Average response time is good (< 500ms)');
  }
  
  if (metrics.cacheHitRate < 50) {
    console.log('⚠️  Cache hit rate is low - consider increasing cache TTL');
  } else {
    console.log('✅ Cache hit rate is good (> 50%)');
  }
  
  if (metrics.successfulRequests / metrics.totalRequests < 0.95) {
    console.log('⚠️  Success rate is below 95% - check for errors');
  } else {
    console.log('✅ Success rate is good (> 95%)');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

module.exports = { runPerformanceTests }; 