# Sojo API Express - Testing Guide

This guide provides comprehensive instructions for testing the Sojo API Express application, ensuring feature parity with MangoMint salon management software.

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Set up test environment
cp env.test.example .env.test
# Edit .env.test with your test database credentials
```

### Run Tests
```bash
# Run all tests
npm test

# Run specific test scenarios
npm run test:smoke        # Quick smoke tests
npm run test:core         # Core salon features
npm run test:appointments # Appointment booking
npm run test:business     # Business management
npm run test:crm          # Customer management
npm run test:integration  # Full integration test
```

## 📋 Test Scenarios

### 1. Authentication & User Management
**File:** `src/__tests__/auth.test.ts`
**Command:** `npm run test:smoke`

Tests user registration, login, logout, and role-based access:
- ✅ Regular user registration
- ✅ Business user registration
- ✅ User login/logout
- ✅ Invalid credential handling
- ✅ Role-based redirects

### 2. Business Management
**File:** `src/__tests__/business.test.ts`
**Command:** `npm run test:business`

Tests business creation, management, and operations:
- ✅ Business creation and setup
- ✅ Business information updates
- ✅ Business search and filtering
- ✅ Category management
- ✅ Business owner relationships

### 3. Staff Management
**File:** `src/__tests__/staff.test.ts`
**Command:** `npm run test:business`

Tests staff member management and role assignments:
- ✅ Staff member addition
- ✅ Role management (staff, admin, owner)
- ✅ Staff search and filtering
- ✅ Staff removal and updates
- ✅ Business-staff relationships

### 4. Service Management
**File:** `src/__tests__/services.test.ts`
**Command:** `npm run test:core`

Tests service catalog management:
- ✅ Service creation and updates
- ✅ Service pricing and duration
- ✅ Service categories and types
- ✅ Service search and filtering
- ✅ Service availability management

### 5. Appointment Booking
**File:** `src/__tests__/appointments.test.ts`
**Command:** `npm run test:appointments`

Tests appointment scheduling and management:
- ✅ Appointment booking
- ✅ Appointment status management (approve, cancel, reschedule)
- ✅ Calendar integration
- ✅ Appointment search and filtering
- ✅ Double-booking prevention

### 6. Customer Management
**File:** `src/__tests__/customers.test.ts`
**Command:** `npm run test:crm`

Tests customer relationship management:
- ✅ Customer profile creation
- ✅ Guest vs registered customers
- ✅ Customer search and filtering
- ✅ Profile updates and management
- ✅ Customer history tracking

### 7. Complete Integration
**File:** `src/__tests__/integration.test.ts`
**Command:** `npm run test:integration`

Tests complete salon management workflows:
- ✅ End-to-end business setup
- ✅ Complete appointment lifecycle
- ✅ Staff and service management
- ✅ Customer onboarding
- ✅ Business dashboard functionality

## 🎯 MangoMint Feature Parity Testing

### Core Features ✅
| Feature | Test Coverage | Status |
|---------|---------------|---------|
| Appointment Scheduling | `appointments.test.ts` | ✅ Complete |
| Client Management | `customers.test.ts` | ✅ Complete |
| Staff Management | `staff.test.ts` | ✅ Complete |
| Service Management | `services.test.ts` | ✅ Complete |
| Business Management | `business.test.ts` | ✅ Complete |
| User Authentication | `auth.test.ts` | ✅ Complete |

### Advanced Features 🚧
| Feature | Implementation Status | Test Coverage |
|---------|----------------------|---------------|
| Point of Sale (POS) | 🚧 Planned | 📋 Ready |
| Marketing Tools | 🚧 Planned | 📋 Ready |
| Automated Reminders | 🚧 Planned | 📋 Ready |
| Gift Card Management | 🚧 Planned | 📋 Ready |
| Inventory Management | 🚧 Planned | 📋 Ready |
| Reporting & Analytics | 🚧 Planned | 📋 Ready |

## 🧪 Test Data Management

### Test Data Generation
All tests use the `TestHelper` class for consistent data generation:

```typescript
// Generate unique test data
const userEmail = TestHelper.generateTestEmail()
const businessData = { ...testData.validBusiness }

// Create test entities
await TestHelper.registerUser(userData)
await TestHelper.createBusiness(userEmail, businessData)
await TestHelper.createService(userEmail, serviceData)
await TestHelper.createAppointment(userEmail, appointmentData)
```

### Test Cleanup
Tests automatically clean up data between runs:
- ✅ Unique email addresses for each test
- ✅ Automatic cleanup after test completion
- ✅ No shared state between tests
- ✅ Fresh data for each test scenario

## 🔧 Test Configuration

### Jest Configuration
**File:** `jest.config.js`

```javascript
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
  // ... other configurations
}
```

### Environment Setup
**File:** `.env.test`

```env
NODE_ENV=test
SUPABASE_URL=your-test-supabase-url
SUPABASE_SERVICE_KEY=your-test-service-key
```

## 📊 Test Reports

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### Test Output
```bash
# Verbose test output
npm test -- --verbose

# Watch mode for development
npm run test:watch

# Run specific test file
npm test -- appointments.test.ts
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check environment variables
cat .env.test

# Verify Supabase connection
npm test -- --testNamePattern="should connect to database"
```

#### 2. Test Timeout Issues
```bash
# Increase timeout for slow tests
npm test -- --testTimeout=30000
```

#### 3. Authentication Failures
```bash
# Check auth token generation
npm test -- --testNamePattern="should register user"
```

#### 4. Data Cleanup Issues
```bash
# Run with cleanup debugging
DEBUG=test-cleanup npm test
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm test

# Debug specific test
npm test -- --testNamePattern="specific test" --verbose
```

## 📈 Performance Testing

### Load Testing
```bash
# Test concurrent operations
npm test -- --testNamePattern="concurrent"

# Test large datasets
npm test -- --testNamePattern="large dataset"
```

### Benchmarking
```bash
# Measure test execution time
time npm test

# Profile slow tests
npm test -- --detectSlowTests
```

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:all
```

## 📝 Adding New Tests

### Test Structure
```typescript
describe('Feature Name', () => {
  beforeEach(async () => {
    await TestHelper.cleanup()
  })

  describe('Specific Functionality', () => {
    it('should handle success case', async () => {
      // Test implementation
      expect(response.status).toBe(200)
    })

    it('should handle error case', async () => {
      // Error test implementation
      expect(response.status).toBe(400)
    })
  })
})
```

### Best Practices
- ✅ Use descriptive test names
- ✅ Test both success and failure scenarios
- ✅ Keep tests independent
- ✅ Use realistic test data
- ✅ Clean up after each test
- ✅ Include integration tests for workflows

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [TypeScript Testing Guide](https://jestjs.io/docs/getting-started#using-typescript)
- [API Testing Best Practices](https://blog.postman.com/api-testing-best-practices/)

## 🆘 Support

For test-related issues:
1. Check the troubleshooting section above
2. Review test logs and error messages
3. Verify environment configuration
4. Check database connectivity
5. Contact the development team

---

**Happy Testing! 🧪✨**
