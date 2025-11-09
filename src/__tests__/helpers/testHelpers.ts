import request from 'supertest'
import app from '../../app'
import { testData } from './testData'

export class TestHelper {
  private static authTokens: { [key: string]: string } = {}
  private static createdIds: { [key: string]: string } = {}

  /**
   * Register a new user and get auth token
   */
  static async registerUser(userData: any = testData.validUser) {
    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData)

    if (response.status === 201) {
      const token = response.body.data?.session?.access_token
      if (token) {
        this.authTokens[userData.email] = token
        this.createdIds[`user_${userData.email}`] = response.body.data?.user?.id
      }
      return response
    }
    return response
  }

  /**
   * Login user and get auth token
   */
  static async loginUser(email: string, password: string) {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password })

    if (response.status === 200) {
      const token = response.body.data?.session?.access_token
      if (token) {
        this.authTokens[email] = token
        this.createdIds[`user_${email}`] = response.body.data?.user?.id
      }
    }
    return response
  }

  /**
   * Get auth token for a user
   */
  static getAuthToken(email: string): string | undefined {
    return this.authTokens[email]
  }

  /**
   * Store a created ID for cleanup
   */
  static storeId(key: string, id: string) {
    this.createdIds[key] = id
  }

  /**
   * Get a stored ID
   */
  static getStoredId(key: string): string | undefined {
    return this.createdIds[key]
  }

  /**
   * Make authenticated request
   */
  static async authenticatedRequest(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    userEmail: string,
    data?: any
  ) {
    const token = this.getAuthToken(userEmail)
    if (!token) {
      throw new Error(`No auth token found for user: ${userEmail}`)
    }

    const req = request(app)[method](url)
      .set('Authorization', `Bearer ${token}`)

    if (data) {
      return req.send(data)
    }
    return req
  }

  /**
   * Create a business for a user
   */
  static async createBusiness(userEmail: string, businessData: any = testData.validBusiness) {
    const response = await this.authenticatedRequest(
      'post',
      '/api/businesses',
      userEmail,
      businessData
    )

    if (response.status === 201) {
      const businessId = response.body.data?.id
      if (businessId) {
        this.storeId(`business_${userEmail}`, businessId)
      }
    }
    return response
  }

  /**
   * Create a service for a business
   */
  static async createService(userEmail: string, serviceData: any = testData.validService) {
    const businessId = this.getStoredId(`business_${userEmail}`)
    if (!businessId) {
      throw new Error(`No business found for user: ${userEmail}`)
    }

    const response = await this.authenticatedRequest(
      'post',
      `/api/services/businesses/${businessId}`,
      userEmail,
      { ...serviceData, business_id: businessId }
    )

    if (response.status === 201) {
      const serviceId = response.body.data?.id
      if (serviceId) {
        this.storeId(`service_${userEmail}`, serviceId)
      }
    }
    return response
  }

  /**
   * Create a customer profile
   */
  static async createCustomer(userEmail: string, customerData: any = testData.validCustomer) {
    const response = await this.authenticatedRequest(
      'post',
      '/api/profiles',
      userEmail,
      customerData
    )

    if (response.status === 201) {
      const customerId = response.body.data?.id
      if (customerId) {
        this.storeId(`customer_${userEmail}`, customerId)
      }
    }
    return response
  }

  /**
   * Add staff to business
   */
  static async addStaff(userEmail: string, staffData: any = testData.validStaff) {
    const businessId = this.getStoredId(`business_${userEmail}`)
    if (!businessId) {
      throw new Error(`No business found for user: ${userEmail}`)
    }

    const response = await this.authenticatedRequest(
      'post',
      `/api/businessUsers/businesses/${businessId}/staff`,
      userEmail,
      staffData
    )

    if (response.status === 201) {
      const staffId = response.body.data?.profile?.id
      if (staffId) {
        this.storeId(`staff_${userEmail}`, staffId)
      }
    }
    return response
  }

  /**
   * Create an appointment
   */
  static async createAppointment(userEmail: string, appointmentData: any = testData.validAppointment) {
    const businessId = this.getStoredId(`business_${userEmail}`)
    const serviceId = this.getStoredId(`service_${userEmail}`)
    const customerId = this.getStoredId(`customer_${userEmail}`)

    if (!businessId || !serviceId || !customerId) {
      throw new Error(`Missing required IDs for appointment creation`)
    }

    const response = await this.authenticatedRequest(
      'post',
      `/api/appointments/businesses/${businessId}/appointments`,
      userEmail,
      {
        ...appointmentData,
        service_id: serviceId,
        user_id: customerId,
      }
    )

    if (response.status === 201) {
      const appointmentId = response.body.data?.id
      if (appointmentId) {
        this.storeId(`appointment_${userEmail}`, appointmentId)
      }
    }
    return response
  }

  /**
   * Clean up created data (for test cleanup)
   */
  static async cleanup() {
    // This would typically delete test data from the database
    // Implementation depends on your database setup
    this.authTokens = {}
    this.createdIds = {}
  }

  /**
   * Wait for a specified amount of time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Generate test email
   */
  static generateTestEmail(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`
  }
}
