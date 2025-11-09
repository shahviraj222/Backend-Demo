# API Test Suite

This test suite provides comprehensive coverage for the Sojo API Express application, ensuring feature parity with MangoMint salon management software.

## Test Coverage

### 🏗️ Core Infrastructure Tests
- **Authentication & Authorization** (`auth.test.ts`)
  - User registration (regular & business users)
  - User login/logout
  - JWT token validation
  - Role-based access control

### 🏢 Business Management Tests
- **Business Operations** (`business.test.ts`)
  - Business creation and management
  - Business search and filtering
  - Category management
  - Business information updates

### 👥 Staff Management Tests
- **Staff Operations** (`staff.test.ts`)
  - Staff member addition and removal
  - Role management (staff, admin, owner)
  - Staff search and filtering
  - Business-user relationships

### 🛍️ Service Management Tests
- **Service Operations** (`services.test.ts`)
  - Service creation and management
  - Service pricing and duration
  - Service search and filtering
  - Service categories and types

### 📅 Appointment Management Tests
- **Appointment Operations** (`appointments.test.ts`)
  - Appointment booking and scheduling
  - Appointment status management (approve, cancel, reschedule)
  - Calendar integration
  - Appointment search and filtering

### 👤 Customer Management Tests
- **Customer Operations** (`customers.test.ts`)
  - Customer profile creation
  - Guest vs regular customer handling
  - Customer search and filtering
  - Profile management

### 🔄 Integration Tests
- **End-to-End Workflows** (`integration.test.ts`)
  - Complete salon management workflow
  - Concurrent operations handling
  - Role management workflows
  - Business dashboard functionality

## MangoMint Feature Parity

This test suite ensures coverage of all major MangoMint features:

### ✅ Implemented & Tested Features

1. **Appointment Scheduling & Booking**
   - ✅ Create, update, cancel appointments
   - ✅ Prevent double bookings
   - ✅ Appointment status management
   - ✅ Calendar integration

2. **Client Management**
   - ✅ Client profile creation and management
   - ✅ Client history tracking
   - ✅ Guest vs registered users

3. **Staff Management**
   - ✅ Staff scheduling and management
   - ✅ Role-based permissions
   - ✅ Performance tracking setup

4. **Service Management**
   - ✅ Service catalog management
   - ✅ Pricing and duration management
   - ✅ Service categories

5. **Business Management**
   - ✅ Multi-business support
   - ✅ Business profile management
   - ✅ Search and filtering

6. **Reporting & Analytics**
   - ✅ Data retrieval for reporting
   - ✅ Business metrics collection

### 🚧 Features for Future Implementation

1. **Point of Sale (POS)**
   - Product management
   - Inventory tracking
   - Payment processing

2. **Marketing Tools**
   - Email campaigns
   - Client segmentation
   - Promotional offers

3. **Automated Reminders**
   - Email/SMS notifications
   - Reminder scheduling

4. **Gift Card Management**
   - Gift card creation and redemption
   - Balance tracking

## Running Tests

### Prerequisites
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Suites
```bash
# Authentication tests
npm test auth.test.ts

# Business management tests
npm test business.test.ts

# Staff management tests
npm test staff.test.ts

# Service management tests
npm test services.test.ts

# Appointment management tests
npm test appointments.test.ts

# Customer management tests
npm test customers.test.ts

# Integration tests
npm test integration.test.ts
```

## Test Environment Setup

### Environment Variables
Create a `.env.test` file with:
```env
NODE_ENV=test
SUPABASE_URL=your_test_supabase_url
SUPABASE_SERVICE_KEY=your_test_service_key
```

### Database Setup
Tests use a separate test database to avoid affecting production data.

## Test Data

All test data is generated using the `testData` helper to ensure:
- Unique email addresses for each test run
- Valid UUIDs for all entities
- Consistent test data structure
- Easy test data customization

## Test Helpers

### TestHelper Class
The `TestHelper` class provides utilities for:
- User registration and authentication
- Business and service creation
- Staff and customer management
- Appointment booking
- Data cleanup between tests

### Usage Example
```typescript
// Create a business user
const userEmail = TestHelper.generateTestEmail()
await TestHelper.registerUser({ email: userEmail, ...userData })

// Create a business
await TestHelper.createBusiness(userEmail, businessData)

// Create a service
await TestHelper.createService(userEmail, serviceData)

// Book an appointment
await TestHelper.createAppointment(userEmail, appointmentData)
```

## Test Scenarios

### Complete Workflow Test
The integration test (`integration.test.ts`) covers a complete salon management workflow:

1. **Business Owner Registration** → Create account
2. **Business Setup** → Create salon business
3. **Service Catalog** → Add services (haircut, manicure, etc.)
4. **Staff Management** → Add staff members
5. **Customer Management** → Create customer profiles
6. **Appointment Booking** → Book appointments
7. **Appointment Management** → Approve, reschedule, cancel
8. **Business Dashboard** → View business overview
9. **Search & Filter** → Find appointments, staff, customers
10. **Business Updates** → Update business information

### Error Handling Tests
Each test suite includes comprehensive error handling:
- Invalid input validation
- Authentication failures
- Authorization errors
- Resource not found scenarios
- Duplicate resource creation
- Malformed requests

### Performance Tests
- Concurrent appointment booking
- Large dataset handling
- Search performance
- Pagination testing

## Contributing

When adding new features:

1. **Add corresponding tests** in the appropriate test file
2. **Update integration tests** if the feature affects workflows
3. **Update this README** to document new test coverage
4. **Ensure test data** is properly cleaned up
5. **Use descriptive test names** that explain the scenario

## Test Maintenance

### Regular Tasks
- Update test data when API changes
- Add tests for new features
- Review and update integration tests
- Monitor test performance and optimize

### Best Practices
- Keep tests independent (no shared state)
- Use meaningful assertions
- Test both success and failure scenarios
- Clean up test data after each test
- Use realistic test data that mirrors production
