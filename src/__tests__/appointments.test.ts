import request from 'supertest'
import app from '../app'
import { TestHelper } from './helpers/testHelpers'
import { testData } from './helpers/testData'

describe('Appointment Management API', () => {
  let businessUserEmail: string
  let authToken: string
  let businessId: string
  let serviceId: string
  let customerId: string

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

    // Create service
    const serviceResponse = await TestHelper.createService(businessUserEmail, testData.validService)
    serviceId = serviceResponse.body.data.id

    // Create customer
    const customerResponse = await TestHelper.createCustomer(businessUserEmail, testData.validCustomer)
    customerId = customerResponse.body.data.id
  })

  describe('POST /api/appointments/businesses/:businessId/appointments', () => {
    it('should create a new appointment successfully', async () => {
      const appointmentData = {
        ...testData.validAppointment,
        service_id: serviceId,
        user_id: customerId,
      }

      const response = await request(app)
        .post(`/api/appointments/businesses/${businessId}/appointments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data.service_id).toBe(serviceId)
      expect(response.body.data.user_id).toBe(customerId)
      expect(response.body.data.business_id).toBe(businessId)
      expect(response.body.data.status).toBe('pending')
    })

    it('should reject appointment with invalid service ID', async () => {
      const appointmentData = {
        ...testData.validAppointment,
        service_id: testData.invalidData.invalidUuid,
        user_id: customerId,
      }

      const response = await request(app)
        .post(`/api/appointments/businesses/${businessId}/appointments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should reject appointment with end time before start time', async () => {
      const appointmentData = {
        start_time: '2024-02-01T11:00:00Z',
        end_time: '2024-02-01T10:00:00Z', // End before start
        service_id: serviceId,
        user_id: customerId,
      }

      const response = await request(app)
        .post(`/api/appointments/businesses/${businessId}/appointments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should require either user_id or business_customer_id', async () => {
      const appointmentData = {
        ...testData.validAppointment,
        service_id: serviceId,
        // Missing both user_id and business_customer_id
      }

      const response = await request(app)
        .post(`/api/appointments/businesses/${businessId}/appointments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /api/appointments/businesses/:businessId/appointments', () => {
    it('should get business appointments', async () => {
      // Create an appointment first
      await TestHelper.createAppointment(businessUserEmail, testData.validAppointment)

      const response = await request(app)
        .get(`/api/appointments/businesses/${businessId}/appointments`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should filter appointments by search query', async () => {
      // Create an appointment first
      await TestHelper.createAppointment(businessUserEmail, testData.validAppointment)

      const response = await request(app)
        .get(`/api/appointments/businesses/${businessId}/appointments`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'John' })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should return empty array for business with no appointments', async () => {
      const response = await request(app)
        .get(`/api/appointments/businesses/${businessId}/appointments`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toEqual([])
    })
  })

  describe('PUT /api/appointments/:id', () => {
    it('should update appointment successfully', async () => {
      // Create an appointment first
      const createResponse = await TestHelper.createAppointment(businessUserEmail, testData.validAppointment)
      const appointmentId = createResponse.body.data.id

      const updateData = {
        start_time: '2024-02-01T14:00:00Z',
        end_time: '2024-02-01T15:00:00Z',
        status: 'confirmed',
      }

      const response = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.data.status).toBe('confirmed')
      expect(response.body.data.start_time).toBe(updateData.start_time)
      expect(response.body.data.end_time).toBe(updateData.end_time)
    })

    it('should return 404 for non-existent appointment', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      
      const response = await request(app)
        .put(`/api/appointments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'confirmed' })

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/appointments/:id/status', () => {
    let appointmentId: string

    beforeEach(async () => {
      // Create an appointment first
      const createResponse = await TestHelper.createAppointment(businessUserEmail, testData.validAppointment)
      appointmentId = createResponse.body.data.id
    })

    it('should approve appointment', async () => {
      const response = await request(app)
        .patch(`/api/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'approve' })

      expect(response.status).toBe(200)
      expect(response.body.data.status).toBe('confirmed')
    })

    it('should cancel appointment', async () => {
      const response = await request(app)
        .patch(`/api/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'cancel' })

      expect(response.status).toBe(200)
      expect(response.body.data.status).toBe('cancelled')
    })

    it('should reschedule appointment', async () => {
      const rescheduleData = {
        action: 'reschedule',
        start_time: '2024-02-01T16:00:00Z',
        end_time: '2024-02-01T17:00:00Z',
      }

      const response = await request(app)
        .patch(`/api/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(rescheduleData)

      expect(response.status).toBe(200)
      expect(response.body.data.status).toBe('pending')
      expect(response.body.data.start_time).toBe(rescheduleData.start_time)
      expect(response.body.data.end_time).toBe(rescheduleData.end_time)
    })

    it('should reject invalid action', async () => {
      const response = await request(app)
        .patch(`/api/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'invalid' })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should require start_time and end_time for reschedule', async () => {
      const response = await request(app)
        .patch(`/api/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'reschedule' })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('DELETE /api/appointments/:id', () => {
    it('should delete appointment successfully', async () => {
      // Create an appointment first
      const createResponse = await TestHelper.createAppointment(businessUserEmail, testData.validAppointment)
      const appointmentId = createResponse.body.data.id

      const response = await request(app)
        .delete(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(204)
    })

    it('should return 404 for non-existent appointment', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      
      const response = await request(app)
        .delete(`/api/appointments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('Calendar API Integration', () => {
    describe('POST /api/calendar/appointments', () => {
      it('should create appointment via calendar API', async () => {
        const appointmentData = {
          date: '2024-02-01T10:00:00Z',
          slot: '10:00 - 11:00',
          service_id: serviceId,
          customer_id: customerId,
        }

        const response = await request(app)
          .post('/api/calendar/appointments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(appointmentData)

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('data')
        expect(response.body.data.service_id).toBe(serviceId)
        expect(response.body.data.customer_id).toBe(customerId)
      })
    })

    describe('GET /api/calendar/appointments', () => {
      it('should get appointments via calendar API', async () => {
        // Create an appointment first
        await TestHelper.createAppointment(businessUserEmail, testData.validAppointment)

        const response = await request(app)
          .get('/api/calendar/appointments')
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('data')
        expect(Array.isArray(response.body.data)).toBe(true)
      })
    })
  })
})
