import { v4 as uuidv4 } from 'uuid'

export const testData = {
  // User data
  validUser: {
    email: 'test@example.com',
    password: 'password123',
    user_type: 'regular' as const,
    full_name: 'Test User',
    phone: '+1234567890',
    country_code: 'US',
  },

  businessUser: {
    email: 'business@example.com',
    password: 'password123',
    user_type: 'business' as const,
    full_name: 'Business Owner',
    phone: '+1234567890',
    country_code: 'US',
  },

  staffUser: {
    email: 'staff@example.com',
    password: 'password123',
    user_type: 'staff' as const,
    full_name: 'Staff Member',
    phone: '+1234567890',
    country_code: 'US',
  },

  // Business data
  validBusiness: {
    name: 'Test Salon',
    description: 'A test salon for testing purposes',
    category: 'Beauty Salon',
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    zip_code: '12345',
    country: 'US',
    phone: '+1234567890',
    email: 'salon@example.com',
    website: 'https://testsalon.com',
    business_hours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { closed: true },
    },
  },

  // Service data
  validService: {
    name: 'Haircut',
    description: 'Professional haircut service',
    service_type: 'hair',
    duration_minutes: 60,
    price: 50.00,
    currency: 'USD',
    room: 'Room 1',
    chair: 'Chair 1',
  },

  validService2: {
    name: 'Manicure',
    description: 'Professional manicure service',
    service_type: 'nails',
    duration_minutes: 45,
    price: 35.00,
    currency: 'USD',
    room: 'Room 2',
    chair: 'Chair 2',
  },

  // Appointment data
  validAppointment: {
    start_time: '2024-02-01T10:00:00Z',
    end_time: '2024-02-01T11:00:00Z',
    status: 'pending' as const,
  },

  // Customer data
  validCustomer: {
    full_name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    country_code: 'US',
    is_guest: false,
  },

  // Staff data
  validStaff: {
    email: 'newstaff@example.com',
    full_name: 'New Staff Member',
    user_type: 'staff' as const,
  },

  // Review data
  validReview: {
    rating: 5,
    comment: 'Excellent service!',
    title: 'Great haircut',
  },

  // Product data
  validProduct: {
    name: 'Shampoo',
    description: 'Professional hair shampoo',
    price: 25.00,
    currency: 'USD',
    category: 'Hair Care',
    brand: 'Test Brand',
    sku: 'SH001',
    stock_quantity: 100,
    is_active: true,
  },

  // Generate random UUIDs for testing
  generateIds: () => ({
    userId: uuidv4(),
    businessId: uuidv4(),
    serviceId: uuidv4(),
    appointmentId: uuidv4(),
    customerId: uuidv4(),
    staffId: uuidv4(),
    reviewId: uuidv4(),
    productId: uuidv4(),
  }),

  // Invalid data for negative testing
  invalidData: {
    invalidEmail: 'not-an-email',
    invalidPassword: '123', // Too short
    invalidPhone: '123', // Too short
    invalidUuid: 'not-a-uuid',
    invalidDate: 'not-a-date',
    invalidPrice: -10, // Negative price
    invalidRating: 6, // Rating out of range
  },
}

export const createTestPayload = (baseData: any, overrides: any = {}) => ({
  ...baseData,
  ...overrides,
})

export const expectValidResponse = (response: any) => {
  expect(response).toHaveProperty('data')
  expect(response.data).toBeDefined()
}

export const expectErrorResponse = (response: any, expectedStatus: number = 400) => {
  expect(response.status).toBe(expectedStatus)
  expect(response.body).toHaveProperty('error')
}

export const expectNotFoundResponse = (response: any) => {
  expect(response.status).toBe(404)
  expect(response.body).toHaveProperty('error')
}
