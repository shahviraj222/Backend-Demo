import request from 'supertest'
import app from '../app'
import { TestHelper } from './helpers/testHelpers'
import { testData } from './helpers/testData'

describe('Business Management API', () => {
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

  describe('POST /api/businesses', () => {
    it('should create a new business successfully', async () => {
      const response = await request(app)
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testData.validBusiness)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data.name).toBe(testData.validBusiness.name)
      expect(response.body.data.description).toBe(testData.validBusiness.description)
      expect(response.body.data.category).toBe(testData.validBusiness.category)
    })

    it('should require business name', async () => {
      const businessData = { ...testData.validBusiness }
      delete businessData.name

      const response = await request(app)
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(businessData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should reject unauthorized requests', async () => {
      const response = await request(app)
        .post('/api/businesses')
        .send(testData.validBusiness)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/businesses', () => {
    it('should get user businesses', async () => {
      // First create a business
      await TestHelper.createBusiness(businessUserEmail, testData.validBusiness)

      const response = await request(app)
        .get('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should return empty array for user with no businesses', async () => {
      const response = await request(app)
        .get('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toEqual([])
    })
  })

  describe('GET /api/businesses/:id', () => {
    it('should get business by ID', async () => {
      // Create a business first
      const createResponse = await TestHelper.createBusiness(businessUserEmail, testData.validBusiness)
      const businessId = createResponse.body.data.id

      const response = await request(app)
        .get(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe(businessId)
      expect(response.body.data.name).toBe(testData.validBusiness.name)
    })

    it('should return 404 for non-existent business', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      
      const response = await request(app)
        .get(`/api/businesses/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/businesses/:id', () => {
    it('should update business successfully', async () => {
      // Create a business first
      const createResponse = await TestHelper.createBusiness(businessUserEmail, testData.validBusiness)
      const businessId = createResponse.body.data.id

      const updateData = {
        name: 'Updated Salon Name',
        description: 'Updated description',
        phone: '+9876543210',
      }

      const response = await request(app)
        .put(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.data.name).toBe(updateData.name)
      expect(response.body.data.description).toBe(updateData.description)
      expect(response.body.data.phone).toBe(updateData.phone)
    })

    it('should return 404 for non-existent business', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      
      const response = await request(app)
        .put(`/api/businesses/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/businesses/:id', () => {
    it('should soft delete business (set is_active to false)', async () => {
      // Create a business first
      const createResponse = await TestHelper.createBusiness(businessUserEmail, testData.validBusiness)
      const businessId = createResponse.body.data.id

      const response = await request(app)
        .delete(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      
      // Verify business is soft deleted
      const getResponse = await request(app)
        .get(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(getResponse.status).toBe(404)
    })
  })

  describe('GET /api/businesses/search', () => {
    it('should search businesses by query', async () => {
      // Create a business first
      await TestHelper.createBusiness(businessUserEmail, testData.validBusiness)

      const response = await request(app)
        .get('/api/businesses/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'Salon' })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should filter businesses by category', async () => {
      // Create a business first
      await TestHelper.createBusiness(businessUserEmail, testData.validBusiness)

      const response = await request(app)
        .get('/api/businesses/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category: 'Beauty Salon' })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /api/businesses/categories/all', () => {
    it('should get all business categories', async () => {
      // Create a business first
      await TestHelper.createBusiness(businessUserEmail, testData.validBusiness)

      const response = await request(app)
        .get('/api/businesses/categories/all')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data).toContain('Beauty Salon')
    })
  })

  describe('GET /api/businesses/owner/:ownerId', () => {
    it('should get businesses by owner ID', async () => {
      // Create a business first
      const createResponse = await TestHelper.createBusiness(businessUserEmail, testData.validBusiness)
      const businessData = createResponse.body.data

      const response = await request(app)
        .get(`/api/businesses/owner/${businessData.owner_id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })
  })
})
