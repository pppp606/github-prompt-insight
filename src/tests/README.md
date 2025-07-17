# Language Settings Persistence Test Suite

This comprehensive test suite verifies that language settings persist correctly across browser sessions in the GitHub Prompt Insight Chrome extension. The tests cover storage persistence, Chrome sync functionality, fallback behavior, extension initialization, and cross-device synchronization.

## 📁 Test Files Overview

### Core Test Files

1. **`language-persistence-test-suite.ts`** - Main test runner that orchestrates all tests
2. **`storage-persistence.test.ts`** - Mock environment tests for storage functionality
3. **`browser-storage-tests.ts`** - Real Chrome extension environment tests
4. **`production-storage-verification.ts`** - Production monitoring and verification
5. **`storage-fallback-tests.ts`** - Error handling and fallback behavior tests
6. **`extension-initialization-tests.ts`** - Extension load time and initialization tests
7. **`cross-device-sync-tests.ts`** - Multi-device synchronization tests
8. **`test-runner.html`** - Browser-based test runner interface

## 🎯 What Gets Tested

### ✅ Storage Persistence
- Language settings survive browser restarts
- Settings persist across extension reloads
- Configuration data integrity
- Storage operation reliability

### ✅ Chrome Sync Storage
- Proper use of Chrome's sync storage API
- Settings available immediately on extension load
- Sync storage vs local storage behavior
- API error handling

### ✅ Cross-Device Synchronization
- Settings sync across multiple devices
- Chrome sync integration
- Conflict resolution
- Offline/online sync behavior

### ✅ Extension Initialization
- Fast load times (< 100ms)
- Language settings immediately available
- Runtime message handling
- Concurrent initialization requests

### ✅ Fallback Behavior
- Graceful handling when storage is unavailable
- Network connectivity issues
- Storage quota exceeded
- Permission denied scenarios

### ✅ Production Monitoring
- Continuous verification
- Performance metrics
- Error tracking
- User experience monitoring

## 🚀 Running the Tests

### Method 1: Browser Console (Recommended)

1. **Load the extension in Chrome**:
   ```bash
   npm run build
   # Load dist/ folder in Chrome extensions
   ```

2. **Open Chrome DevTools** (F12) and run:
   ```javascript
   // Run all tests
   runAllPersistenceTests().then(results => {
     console.log('Test Results:', results);
   });
   
   // Run essential tests only (faster)
   runEssentialPersistenceTests().then(results => {
     console.log('Essential Test Results:', results);
   });
   
   // Run production verification
   runProductionPersistenceTests().then(results => {
     console.log('Production Test Results:', results);
   });
   ```

### Method 2: Test Runner HTML Interface

1. **Open `test-runner.html`** in your browser
2. **Click the test buttons** to run different test suites
3. **View results** in the interactive interface

### Method 3: Programmatic Testing

```typescript
import { LanguagePersistenceTestSuite } from './language-persistence-test-suite';

const suite = new LanguagePersistenceTestSuite();

// Run all tests
const results = await suite.runAllTests();

// Generate report
const report = suite.generateDetailedReport();
console.log(report);
```

## 📊 Test Results Interpretation

### Success Criteria
- **Overall Success Rate**: > 90%
- **Initialization Time**: < 100ms
- **Storage Operations**: < 50ms
- **Cross-Device Sync**: < 5 minutes
- **Error Recovery**: < 30 seconds

### Understanding Results

```javascript
{
  suites: [
    {
      suiteName: "Storage Persistence Tests",
      passed: 8,
      failed: 2,
      total: 10,
      duration: 1234.56
    }
  ],
  overallSummary: {
    totalTests: 50,
    totalPassed: 45,
    totalFailed: 5,
    overallSuccessRate: 90.0,
    totalDuration: 2654.20
  },
  recommendations: [
    "Overall success rate is good but could be improved"
  ],
  issues: [
    "Some initialization tests failed"
  ]
}
```

## 🔧 Manual Testing Procedures

### Basic Session Persistence Test

1. **Set Language**:
   - Open extension options
   - Set default language to "Japanese"
   - Save settings

2. **Restart Browser**:
   - Close Chrome completely
   - Reopen Chrome
   - Check extension options

3. **Verify**: Language should still be "Japanese"

### Cross-Device Sync Test

1. **Device 1**:
   - Set language to "Spanish"
   - Ensure Chrome sync is enabled

2. **Device 2**:
   - Wait 2-3 minutes
   - Check extension options
   - Language should be "Spanish"

### Extension Reload Test

1. **Set Language**: Change to "French"
2. **Reload Extension**: Go to chrome://extensions/ and click "Reload"
3. **Verify**: Language should still be "French"

## 🛠️ Integration with Development

### Development Testing
```bash
# Run tests during development
npm run test:persistence

# Include in build process
npm run build && npm run test:persistence
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
- name: Run Persistence Tests
  run: |
    npm run build
    npm run test:persistence
```

### Production Monitoring
```javascript
// Include in extension for production monitoring
import { ProductionStorageVerification } from './tests/production-storage-verification';

const verification = new ProductionStorageVerification();
verification.startContinuousMonitoring(30000); // Every 30 seconds
```

## 📈 Performance Benchmarks

### Expected Load Times
- **Cold Start**: < 100ms
- **Warm Start**: < 50ms
- **Runtime Messages**: < 150ms
- **Default Values**: < 10ms

### Storage Operations
- **Read Config**: < 20ms
- **Write Config**: < 30ms
- **Update Config**: < 25ms
- **Clear Config**: < 15ms

### Sync Operations
- **Local to Sync**: < 100ms
- **Cross-Device**: < 300ms (plus network latency)
- **Conflict Resolution**: < 50ms

## 🐛 Troubleshooting

### Common Issues

1. **Tests Not Running**:
   - Check Chrome extension is loaded
   - Verify Chrome APIs are available
   - Check console for errors

2. **Sync Tests Failing**:
   - Enable Chrome sync
   - Check internet connection
   - Verify sync permissions

3. **Slow Performance**:
   - Check network connectivity
   - Clear extension data
   - Restart Chrome

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('debug-persistence-tests', 'true');

// Run tests with verbose output
runAllPersistenceTests().then(results => {
  console.log('Debug Results:', results);
});
```

## 📋 Test Checklist

Before releasing:
- [ ] All core tests pass (> 90% success rate)
- [ ] Initialization tests pass (< 100ms load time)
- [ ] Storage persistence verified across sessions
- [ ] Cross-device sync functionality working
- [ ] Fallback behavior handles errors gracefully
- [ ] Production monitoring tests pass

## 🔍 Monitoring in Production

### Key Metrics to Track
- Storage operation success rates
- Initialization load times
- Cross-device sync latency
- Error frequency and types
- User experience metrics

### Alerting Thresholds
- Success rate < 95%
- Load time > 200ms
- Sync latency > 10 minutes
- Error rate > 5%

## 📚 Additional Resources

- [Chrome Extension Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Chrome Sync Documentation](https://developer.chrome.com/docs/extensions/mv3/storage/)
- [Extension Testing Best Practices](https://developer.chrome.com/docs/extensions/mv3/testing/)

## 🤝 Contributing

When adding new tests:
1. Follow the existing test structure
2. Include both positive and negative test cases
3. Add performance benchmarks
4. Update this README with new test information
5. Ensure tests are deterministic and reliable

## 📄 License

This test suite is part of the GitHub Prompt Insight Chrome extension and follows the same licensing terms.