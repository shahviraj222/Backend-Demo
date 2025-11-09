import request from 'supertest'
import app from '../app'
import { TestHelper } from './helpers/testHelpers'
import { testData } from './helpers/testData'

describe('Staff Management API', () => {
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

  describe('POST /api/businessUsers/businesses/:businessId/staff', () => {
    it('should add staff member successfully', async () => {
      const staffData = {
        email: TestHelper.generateTestEmail(),
        full_name: 'New Staff Member',
      }

      const response = await request(app)
        .post(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(staffData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('profile')
      expect(response.body.data).toHaveProperty('businessUser')
      expect(response.body.data.profile.email).toBe(staffData.email)
      expect(response.body.data.profile.full_name).toBe(staffData.full_name)
    })

    it('should add existing staff member to business', async () => {
      // First, create a staff profile
      const staffEmail = TestHelper.generateTestEmail()
      const staffData = {
        email: staffEmail,
        full_name: 'Existing Staff',
        user_type: 'staff',
      }

      // Create the staff profile first
      const profileResponse = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(staffData)

      expect(profileResponse.status).toBe(201)

      // Now add them to the business
      const response = await request(app)
        .post(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: staffEmail,
          full_name: 'Existing Staff',
        })

      expect(response.status).toBe(201)
      expect(response.body.data.profile.email).toBe(staffEmail)
    })

    it('should reject duplicate staff member', async () => {
      const staffData = {
        email: TestHelper.generateTestEmail(),
        full_name: 'Staff Member',
      }

      // Add staff first time
      await request(app)
        .post(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(staffData)

      // Try to add same staff again
      const response = await request(app)
        .post(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(staffData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Staff already added to this business')
    })

    it('should require email and full_name', async () => {
      const response = await request(app)
        .post(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should reject unauthorized requests', async () => {
      const staffData = {
        email: TestHelper.generateTestEmail(),
        full_name: 'Staff Member',
      }

      const response = await request(app)
        .post(`/api/businessUsers/businesses/${businessId}/staff`)
        .send(staffData)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/businessUsers/businesses/:businessId/staff', () => {
    it('should get business staff members', async () => {
      // Add a staff member first
      await TestHelper.addStaff(businessUserEmail, {
        email: TestHelper.generateTestEmail(),
        full_name: 'Staff Member 1',
      })

      const response = await request(app)
        .get(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should filter staff by search query', async () => {
      // Add staff members first
      await TestHelper.addStaff(businessUserEmail, {
        email: TestHelper.generateTestEmail(),
        full_name: 'John Smith',
      })

      await TestHelper.addStaff(businessUserEmail, {
        email: TestHelper.generateTestEmail(),
        full_name: 'Jane Doe',
      })

      const response = await request(app)
        .get(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'John' })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.every((staff: any) => 
        staff.full_name.toLowerCase().includes('john')
      )).toBe(true)
    })

    it('should return empty array for business with no staff', async () => {
      const response = await request(app)
        .get(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toEqual([])
    })
  })

  describe('GET /api/businessUsers/:id', () => {
    it('should get business user by ID', async () => {
      // Add a staff member first
      const addStaffResponse = await TestHelper.addStaff(businessUserEmail, {
        email: TestHelper.generateTestEmail(),
        full_name: 'Staff Member',
      })

      const businessUserId = addStaffResponse.body.data.businessUser.id

      const response = await request(app)
        .get(`/api/businessUsers/${businessUserId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe(businessUserId)
      expect(response.body.data.role).toBe('staff')
    })

    it('should return 404 for non-existent business user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      
      const response = await request(app)
        .get(`/api/businessUsers/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/businessUsers/:id', () => {
    it('should update business user role', async () => {
      // Add a staff member first
      const addStaffResponse = await TestHelper.addStaff(businessUserEmail, {
        email: TestHelper.generateTestEmail(),
        full_name: 'Staff Member',
      })

      const businessUserId = addStaffResponse.body.data.businessUser.id

      const updateData = {
        role: 'admin',
      }

      const response = await request(app)
        .put(`/api/businessUsers/${businessUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.data.role).toBe('admin')
    })

    it('should return 404 for non-existent business user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      
      const response = await request(app)
        .put(`/api/businessUsers/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'admin' })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/businessUsers/:id', () => {
    it('should remove staff from business', async () => {
      // Add a staff member first
      const addStaffResponse = await TestHelper.addStaff(businessUserEmail, {
        email: TestHelper.generateTestEmail(),
        full_name: 'Staff Member',
      })

      const businessUserId = addStaffResponse.body.data.businessUser.id

      const response = await request(app)
        .delete(`/api/businessUsers/${businessUserId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
    })

    it('should return 404 for non-existent business user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      
      const response = await request(app)
        .delete(`/api/businessUsers/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/businessUsers/role/:role', () => {
    it('should get users by role', async () => {
      // Add staff members first
      await TestHelper.addStaff(businessUserEmail, {
        email: TestHelper.generateTestEmail(),
        full_name: 'Staff Member 1',
      })

      await TestHelper.addStaff(businessUserEmail, {
        email: TestHelper.generateTestEmail(),
        full_name: 'Staff Member 2',
      })

      const response = await request(app)
        .get('/api/businessUsers/role/staff')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.every((user: any) => user.role === 'staff')).toBe(true)
    })
  })

  describe('GET /api/businessUsers/business/:businessId', () => {
    it('should get all business users for a business', async () => {
      // Add staff members first
      await TestHelper.addStaff(businessUserEmail, {
        email: TestHelper.generateTestEmail(),
        full_name: 'Staff Member 1',
      })

      await TestHelper.addStaff(businessUserEmail, {
        email: TestHelper.generateTestEmail(),
        full_name: 'Staff Member 2',
      })

      const response = await request(app)
        .get(`/api/businessUsers/business/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })
  })
})
