import request from 'supertest'
import app from '../app'
import { TestHelper } from './helpers/testHelpers'
import { testData } from './helpers/testData'

describe('Customer Management API', () => {
  let businessUserEmail: string
  let authToken: string

  beforeEach(async () => {
    await TestHelper.cleanup()
    
    // Create a business user for testing
    businessUserEmail = TestHelper.generateTestEmail()
    const businessUserData = {
      ...testData.businessUser,
      email: businessUserEmail,
    }

    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send(businessUserData)

    if (signupResponse.status === 201) {
      authToken = signupResponse.body.session.access_token
    }
  })

  describe('GET /api/customers', () => {
    it('should get all customers', async () => {
      // Create some customer profiles first
      await TestHelper.createCustomer(businessUserEmail, {
        ...testData.validCustomer,
        email: TestHelper.generateTestEmail(),
      })

      await TestHelper.createCustomer(businessUserEmail, {
        ...testData.validCustomer,
        email: TestHelper.generateTestEmail(),
        full_name: 'Jane Smith',
      })

      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should return empty array when no customers exist', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toEqual([])
    })

    it('should reject unauthorized requests', async () => {
      const response = await request(app)
        .get('/api/customers')

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/customers/:id', () => {
    it('should get customer by ID', async () => {
      // Create a customer first
      const createResponse = await TestHelper.createCustomer(businessUserEmail, {
        ...testData.validCustomer,
        email: TestHelper.generateTestEmail(),
      })

      const customerId = createResponse.body.data.id

      const response = await request(app)
        .get(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe(customerId)
      expect(response.body.data.full_name).toBe(testData.validCustomer.full_name)
      expect(response.body.data.email).toBeDefined()
    })

    it('should return 404 for non-existent customer', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      
      const response = await request(app)
        .get(`/api/customers/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toBe('Customer not found')
    })

    it('should reject unauthorized requests', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      
      const response = await request(app)
        .get(`/api/customers/${fakeId}`)

      expect(response.status).toBe(401)
    })
  })

  describe('Customer Profile Management', () => {
    describe('POST /api/profiles', () => {
      it('should create customer profile successfully', async () => {
        const customerData = {
          ...testData.validCustomer,
          email: TestHelper.generateTestEmail(),
        }

        const response = await request(app)
          .post('/api/profiles')
          .set('Authorization', `Bearer ${authToken}`)
          .send(customerData)

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('data')
        expect(response.body.data.full_name).toBe(customerData.full_name)
        expect(response.body.data.email).toBe(customerData.email)
        expect(response.body.data.phone).toBe(customerData.phone)
        expect(response.body.data.is_guest).toBe(false)
      })

      it('should create guest profile successfully', async () => {
        const guestData = {
          full_name: 'Guest User',
          email: TestHelper.generateTestEmail(),
          phone: '+1234567890',
          is_guest: true,
        }

        const response = await request(app)
          .post('/api/profiles')
          .set('Authorization', `Bearer ${authToken}`)
          .send(guestData)

        expect(response.status).toBe(201)
        expect(response.body.data.is_guest).toBe(true)
      })

      it('should require valid email format', async () => {
        const customerData = {
          ...testData.validCustomer,
          email: testData.invalidData.invalidEmail,
        }

        const response = await request(app)
          .post('/api/profiles')
          .set('Authorization', `Bearer ${authToken}`)
          .send(customerData)

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error')
      })

      it('should reject unauthorized requests', async () => {
        const customerData = {
          ...testData.validCustomer,
          email: TestHelper.generateTestEmail(),
        }

        const response = await request(app)
          .post('/api/profiles')
          .send(customerData)

        expect(response.status).toBe(401)
      })
    })

    describe('GET /api/profiles/:id', () => {
      it('should get profile by ID', async () => {
        // Create a profile first
        const createResponse = await TestHelper.createCustomer(businessUserEmail, {
          ...testData.validCustomer,
          email: TestHelper.generateTestEmail(),
        })

        const profileId = createResponse.body.data.id

        const response = await request(app)
          .get(`/api/profiles/${profileId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
        expect(response.body.data.id).toBe(profileId)
      })

      it('should return 404 for non-existent profile', async () => {
        const fakeId = '123e4567-e89b-12d3-a456-426614174000'
        
        const response = await request(app)
          .get(`/api/profiles/${fakeId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(404)
      })
    })

    describe('PUT /api/profiles/:id', () => {
      it('should update profile successfully', async () => {
        // Create a profile first
        const createResponse = await TestHelper.createCustomer(businessUserEmail, {
          ...testData.validCustomer,
          email: TestHelper.generateTestEmail(),
        })

        const profileId = createResponse.body.data.id

        const updateData = {
          full_name: 'Updated Name',
          phone: '+9876543210',
        }

        const response = await request(app)
          .put(`/api/profiles/${profileId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)

        expect(response.status).toBe(200)
        expect(response.body.data.full_name).toBe(updateData.full_name)
        expect(response.body.data.phone).toBe(updateData.phone)
      })

      it('should return 404 for non-existent profile', async () => {
        const fakeId = '123e4567-e89b-12d3-a456-426614174000'
        
        const response = await request(app)
          .put(`/api/profiles/${fakeId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ full_name: 'Updated Name' })

        expect(response.status).toBe(404)
      })
    })

    describe('DELETE /api/profiles/:id', () => {
      it('should delete profile successfully', async () => {
        // Create a profile first
        const createResponse = await TestHelper.createCustomer(businessUserEmail, {
          ...testData.validCustomer,
          email: TestHelper.generateTestEmail(),
        })

        const profileId = createResponse.body.data.id

        const response = await request(app)
          .delete(`/api/profiles/${profileId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
      })

      it('should return 404 for non-existent profile', async () => {
        const fakeId = '123e4567-e89b-12d3-a456-426614174000'
        
        const response = await request(app)
          .delete(`/api/profiles/${fakeId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(404)
      })
    })
  })

  describe('Customer Search and Filtering', () => {
    beforeEach(async () => {
      // Create multiple customers for search testing
      await TestHelper.createCustomer(businessUserEmail, {
        full_name: 'John Smith',
        email: TestHelper.generateTestEmail(),
        phone: '+1234567890',
      })

      await TestHelper.createCustomer(businessUserEmail, {
        full_name: 'Jane Doe',
        email: TestHelper.generateTestEmail(),
        phone: '+1234567891',
      })

      await TestHelper.createCustomer(businessUserEmail, {
        full_name: 'Bob Johnson',
        email: TestHelper.generateTestEmail(),
        phone: '+1234567892',
      })
    })

    it('should search customers by name', async () => {
      const response = await request(app)
        .get('/api/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'John' })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should search customers by email', async () => {
      const response = await request(app)
        .get('/api/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'jane' })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('Guest vs Regular Customers', () => {
    it('should get only guest profiles', async () => {
      // Create both guest and regular profiles
      await TestHelper.createCustomer(businessUserEmail, {
        full_name: 'Guest User',
        email: TestHelper.generateTestEmail(),
        is_guest: true,
      })

      await TestHelper.createCustomer(businessUserEmail, {
        full_name: 'Regular User',
        email: TestHelper.generateTestEmail(),
        is_guest: false,
      })

      const response = await request(app)
        .get('/api/profiles/guests')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.every((profile: any) => profile.is_guest === true)).toBe(true)
    })

    it('should get only full account profiles', async () => {
      // Create both guest and regular profiles
      await TestHelper.createCustomer(businessUserEmail, {
        full_name: 'Guest User',
        email: TestHelper.generateTestEmail(),
        is_guest: true,
      })

      await TestHelper.createCustomer(businessUserEmail, {
        full_name: 'Regular User',
        email: TestHelper.generateTestEmail(),
        is_guest: false,
      })

      const response = await request(app)
        .get('/api/profiles/full')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.every((profile: any) => profile.is_guest === false)).toBe(true)
    })
  })
})
