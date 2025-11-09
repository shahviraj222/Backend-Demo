import request from 'supertest'
import app from '../app'
import { TestHelper } from './helpers/testHelpers'
import { testData } from './helpers/testData'

describe('Service Management API', () => {
  let businessUserEmail: string
  let authToken: string
  let businessId: string

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

    // Create business
    const businessResponse = await TestHelper.createBusiness(businessUserEmail, testData.validBusiness)
    businessId = businessResponse.body.data.id
  })

  describe('POST /api/services/businesses/:businessId', () => {
    it('should create a new service successfully', async () => {
      const serviceData = {
        ...testData.validService,
        business_id: businessId,
      }

      const response = await request(app)
        .post(`/api/services/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(serviceData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data.name).toBe(serviceData.name)
      expect(response.body.data.description).toBe(serviceData.description)
      expect(response.body.data.duration_minutes).toBe(serviceData.duration_minutes)
      expect(response.body.data.price).toBe(serviceData.price)
      expect(response.body.data.business_id).toBe(businessId)
    })

    it('should require service name', async () => {
      const serviceData = {
        ...testData.validService,
        business_id: businessId,
      }
      delete serviceData.name

      const response = await request(app)
        .post(`/api/services/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(serviceData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should require valid price', async () => {
      const serviceData = {
        ...testData.validService,
        business_id: businessId,
        price: testData.invalidData.invalidPrice,
      }

      const response = await request(app)
        .post(`/api/services/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(serviceData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should reject unauthorized requests', async () => {
      const serviceData = {
        ...testData.validService,
        business_id: businessId,
      }

      const response = await request(app)
        .post(`/api/services/businesses/${businessId}`)
        .send(serviceData)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/services/businesses/:businessId', () => {
    it('should get business services', async () => {
      // Create a service first
      await TestHelper.createService(businessUserEmail, testData.validService)

      const response = await request(app)
        .get(`/api/services/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should filter services by search query', async () => {
      // Create a service first
      await TestHelper.createService(businessUserEmail, testData.validService)

      const response = await request(app)
        .get(`/api/services/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Hair' })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should return empty array for business with no services', async () => {
      const response = await request(app)
        .get(`/api/services/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toEqual([])
    })
  })

  describe('GET /api/services/:id', () => {
    it('should get service by ID', async () => {
      // Create a service first
      const createResponse = await TestHelper.createService(businessUserEmail, testData.validService)
      const serviceId = createResponse.body.data.id

      const response = await request(app)
        .get(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe(serviceId)
      expect(response.body.data.name).toBe(testData.validService.name)
    })

    it('should return 404 for non-existent service', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      
      const response = await request(app)
        .get(`/api/services/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/services/:id', () => {
    it('should update service successfully', async () => {
      // Create a service first
      const createResponse = await TestHelper.createService(businessUserEmail, testData.validService)
      const serviceId = createResponse.body.data.id

      const updateData = {
        name: 'Updated Haircut',
        description: 'Updated haircut description',
        price: 60.00,
        duration_minutes: 75,
      }

      const response = await request(app)
        .put(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.data.name).toBe(updateData.name)
      expect(response.body.data.description).toBe(updateData.description)
      expect(response.body.data.price).toBe(updateData.price)
      expect(response.body.data.duration_minutes).toBe(updateData.duration_minutes)
    })

    it('should return 404 for non-existent service', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      
      const response = await request(app)
        .put(`/api/services/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/services/:id', () => {
    it('should delete service successfully', async () => {
      // Create a service first
      const createResponse = await TestHelper.createService(businessUserEmail, testData.validService)
      const serviceId = createResponse.body.data.id

      const response = await request(app)
        .delete(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(204)
    })

    it('should return 404 for non-existent service', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      
      const response = await request(app)
        .delete(`/api/services/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/services/search', () => {
    it('should search services by query', async () => {
      // Create services first
      await TestHelper.createService(businessUserEmail, testData.validService)
      await TestHelper.createService(businessUserEmail, testData.validService2)

      const response = await request(app)
        .get('/api/services/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'Hair' })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should filter services by service type', async () => {
      // Create services first
      await TestHelper.createService(businessUserEmail, testData.validService)
      await TestHelper.createService(businessUserEmail, testData.validService2)

      const response = await request(app)
        .get('/api/services/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ service_type: 'hair' })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should filter services by price range', async () => {
      // Create services first
      await TestHelper.createService(businessUserEmail, testData.validService)
      await TestHelper.createService(businessUserEmail, testData.validService2)

      const response = await request(app)
        .get('/api/services/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ min_price: 40, max_price: 60 })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /api/services', () => {
    it('should get all services (admin view)', async () => {
      // Create services first
      await TestHelper.createService(businessUserEmail, testData.validService)
      await TestHelper.createService(businessUserEmail, testData.validService2)

      const response = await request(app)
        .get('/api/services')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })
})
