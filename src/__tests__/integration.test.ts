import request from 'supertest'
import app from '../app'
import { TestHelper } from './helpers/testHelpers'
import { testData } from './helpers/testData'

describe('Complete Salon Management Workflow Integration Tests', () => {
  let businessOwnerEmail: string
  let businessOwnerToken: string
  let businessId: string
  let serviceId: string
  let staffId: string
  let customerId: string
  let appointmentId: string

  beforeEach(async () => {
    await TestHelper.cleanup()
  })

  describe('Complete MangoMint-like Workflow', () => {
    it('should handle complete salon management workflow', async () => {
      // Step 1: Business Owner Registration
      console.log('Step 1: Registering business owner...')
      businessOwnerEmail = TestHelper.generateTestEmail()
      const businessOwnerData = {
        ...testData.businessUser,
        email: businessOwnerEmail,
      }

      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send(businessOwnerData)

      expect(signupResponse.status).toBe(201)
      businessOwnerToken = signupResponse.body.session.access_token

      // Step 2: Create Business
      console.log('Step 2: Creating business...')
      const businessResponse = await request(app)
        .post('/api/businesses')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send(testData.validBusiness)

      expect(businessResponse.status).toBe(201)
      businessId = businessResponse.body.data.id

      // Step 3: Add Services
      console.log('Step 3: Adding services...')
      const serviceResponse = await request(app)
        .post(`/api/services/businesses/${businessId}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          ...testData.validService,
          business_id: businessId,
        })

      expect(serviceResponse.status).toBe(201)
      serviceId = serviceResponse.body.data.id

      // Add second service
      const service2Response = await request(app)
        .post(`/api/services/businesses/${businessId}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          ...testData.validService2,
          business_id: businessId,
        })

      expect(service2Response.status).toBe(201)

      // Step 4: Add Staff Members
      console.log('Step 4: Adding staff members...')
      const staffData1 = {
        email: TestHelper.generateTestEmail(),
        full_name: 'Sarah Johnson',
      }

      const staffResponse1 = await request(app)
        .post(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send(staffData1)

      expect(staffResponse1.status).toBe(201)
      staffId = staffResponse1.body.data.profile.id

      // Add second staff member
      const staffData2 = {
        email: TestHelper.generateTestEmail(),
        full_name: 'Mike Wilson',
      }

      const staffResponse2 = await request(app)
        .post(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send(staffData2)

      expect(staffResponse2.status).toBe(201)

      // Step 5: Create Customer Profiles
      console.log('Step 5: Creating customer profiles...')
      const customerResponse = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          ...testData.validCustomer,
          email: TestHelper.generateTestEmail(),
        })

      expect(customerResponse.status).toBe(201)
      customerId = customerResponse.body.data.id

      // Create second customer
      const customer2Response = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          full_name: 'Emily Davis',
          email: TestHelper.generateTestEmail(),
          phone: '+1234567891',
          is_guest: false,
        })

      expect(customer2Response.status).toBe(201)

      // Step 6: Book Appointments
      console.log('Step 6: Booking appointments...')
      const appointmentData = {
        start_time: '2024-02-15T10:00:00Z',
        end_time: '2024-02-15T11:00:00Z',
        service_id: serviceId,
        user_id: customerId,
        staff_user_id: staffId,
      }

      const appointmentResponse = await request(app)
        .post(`/api/appointments/businesses/${businessId}/appointments`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send(appointmentData)

      expect(appointmentResponse.status).toBe(201)
      appointmentId = appointmentResponse.body.data.id

      // Book second appointment
      const appointment2Data = {
        start_time: '2024-02-15T14:00:00Z',
        end_time: '2024-02-15T14:45:00Z',
        service_id: serviceId,
        user_id: customer2Response.body.data.id,
      }

      const appointment2Response = await request(app)
        .post(`/api/appointments/businesses/${businessId}/appointments`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send(appointment2Data)

      expect(appointment2Response.status).toBe(201)

      // Step 7: Manage Appointments
      console.log('Step 7: Managing appointments...')
      
      // Get all appointments for business
      const getAppointmentsResponse = await request(app)
        .get(`/api/appointments/businesses/${businessId}/appointments`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(getAppointmentsResponse.status).toBe(200)
      expect(getAppointmentsResponse.body.data.length).toBe(2)

      // Approve first appointment
      const approveResponse = await request(app)
        .patch(`/api/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({ action: 'approve' })

      expect(approveResponse.status).toBe(200)
      expect(approveResponse.body.data.status).toBe('confirmed')

      // Reschedule second appointment
      const rescheduleResponse = await request(app)
        .patch(`/api/appointments/${appointment2Response.body.data.id}/status`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          action: 'reschedule',
          start_time: '2024-02-15T15:00:00Z',
          end_time: '2024-02-15T15:45:00Z',
        })

      expect(rescheduleResponse.status).toBe(200)
      expect(rescheduleResponse.body.data.status).toBe('pending')

      // Step 8: View Business Dashboard
      console.log('Step 8: Viewing business dashboard...')
      
      // Get business info
      const businessInfoResponse = await request(app)
        .get(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(businessInfoResponse.status).toBe(200)
      expect(businessInfoResponse.body.data.name).toBe(testData.validBusiness.name)

      // Get business services
      const servicesResponse = await request(app)
        .get(`/api/services/businesses/${businessId}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(servicesResponse.status).toBe(200)
      expect(servicesResponse.body.data.length).toBe(2)

      // Get business staff
      const staffResponse = await request(app)
        .get(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(staffResponse.status).toBe(200)
      expect(staffResponse.body.data.length).toBe(2)

      // Get customers
      const customersResponse = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(customersResponse.status).toBe(200)
      expect(customersResponse.body.data.length).toBeGreaterThanOrEqual(2)

      // Step 9: Search and Filter
      console.log('Step 9: Testing search and filter functionality...')
      
      // Search appointments by customer name
      const searchAppointmentsResponse = await request(app)
        .get(`/api/appointments/businesses/${businessId}/appointments`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .query({ search: 'John' })

      expect(searchAppointmentsResponse.status).toBe(200)

      // Search services by name
      const searchServicesResponse = await request(app)
        .get(`/api/services/businesses/${businessId}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .query({ search: 'Hair' })

      expect(searchServicesResponse.status).toBe(200)

      // Search staff by name
      const searchStaffResponse = await request(app)
        .get(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .query({ search: 'Sarah' })

      expect(searchStaffResponse.status).toBe(200)

      // Step 10: Update Business Information
      console.log('Step 10: Updating business information...')
      
      const updateBusinessResponse = await request(app)
        .put(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          phone: '+1987654321',
          address: '456 Updated Street',
          description: 'Updated salon description',
        })

      expect(updateBusinessResponse.status).toBe(200)
      expect(updateBusinessResponse.body.data.phone).toBe('+1987654321')
      expect(updateBusinessResponse.body.data.address).toBe('456 Updated Street')

      // Step 11: Cancel Appointment
      console.log('Step 11: Canceling appointment...')
      
      const cancelResponse = await request(app)
        .patch(`/api/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({ action: 'cancel' })

      expect(cancelResponse.status).toBe(200)
      expect(cancelResponse.body.data.status).toBe('cancelled')

      // Step 12: Remove Staff Member
      console.log('Step 12: Removing staff member...')
      
      const staffToRemoveId = staffResponse2.body.data.businessUser.id
      const removeStaffResponse = await request(app)
        .delete(`/api/businessUsers/${staffToRemoveId}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(removeStaffResponse.status).toBe(200)

      // Verify staff count decreased
      const updatedStaffResponse = await request(app)
        .get(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(updatedStaffResponse.status).toBe(200)
      expect(updatedStaffResponse.body.data.length).toBe(1)

      console.log('✅ Complete salon management workflow test passed!')
    })

    it('should handle concurrent appointment bookings', async () => {
      // Setup business and services
      businessOwnerEmail = TestHelper.generateTestEmail()
      const businessOwnerData = {
        ...testData.businessUser,
        email: businessOwnerEmail,
      }

      await request(app)
        .post('/api/auth/signup')
        .send(businessOwnerData)

      const loginResponse = await TestHelper.loginUser(businessOwnerEmail, businessOwnerData.password)
      businessOwnerToken = loginResponse.body.session.access_token

      const businessResponse = await TestHelper.createBusiness(businessOwnerEmail, testData.validBusiness)
      businessId = businessResponse.body.data.id

      const serviceResponse = await TestHelper.createService(businessOwnerEmail, testData.validService)
      serviceId = serviceResponse.body.data.id

      const customerResponse = await TestHelper.createCustomer(businessOwnerEmail, testData.validCustomer)
      customerId = customerResponse.body.data.id

      // Create second customer
      const customer2Response = await TestHelper.createCustomer(businessOwnerEmail, {
        full_name: 'Jane Smith',
        email: TestHelper.generateTestEmail(),
        phone: '+1234567891',
      })

      // Try to book two appointments at the same time
      const appointment1Data = {
        start_time: '2024-02-15T10:00:00Z',
        end_time: '2024-02-15T11:00:00Z',
        service_id: serviceId,
        user_id: customerId,
      }

      const appointment2Data = {
        start_time: '2024-02-15T10:00:00Z', // Same time slot
        end_time: '2024-02-15T11:00:00Z',
        service_id: serviceId,
        user_id: customer2Response.body.data.id,
      }

      // Book both appointments concurrently
      const [response1, response2] = await Promise.all([
        request(app)
          .post(`/api/appointments/businesses/${businessId}/appointments`)
          .set('Authorization', `Bearer ${businessOwnerToken}`)
          .send(appointment1Data),
        request(app)
          .post(`/api/appointments/businesses/${businessId}/appointments`)
          .set('Authorization', `Bearer ${businessOwnerToken}`)
          .send(appointment2Data),
      ])

      // Both should succeed (in real implementation, you might want to prevent double booking)
      expect(response1.status).toBe(201)
      expect(response2.status).toBe(201)

      // Verify both appointments exist
      const appointmentsResponse = await request(app)
        .get(`/api/appointments/businesses/${businessId}/appointments`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(appointmentsResponse.status).toBe(200)
      expect(appointmentsResponse.body.data.length).toBe(2)
    })

    it('should handle staff role management', async () => {
      // Setup
      businessOwnerEmail = TestHelper.generateTestEmail()
      const businessOwnerData = {
        ...testData.businessUser,
        email: businessOwnerEmail,
      }

      await request(app)
        .post('/api/auth/signup')
        .send(businessOwnerData)

      const loginResponse = await TestHelper.loginUser(businessOwnerEmail, businessOwnerData.password)
      businessOwnerToken = loginResponse.body.session.access_token

      const businessResponse = await TestHelper.createBusiness(businessOwnerEmail, testData.validBusiness)
      businessId = businessResponse.body.data.id

      // Add staff member
      const staffData = {
        email: TestHelper.generateTestEmail(),
        full_name: 'Staff Member',
      }

      const addStaffResponse = await request(app)
        .post(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send(staffData)

      expect(addStaffResponse.status).toBe(201)
      const businessUserId = addStaffResponse.body.data.businessUser.id

      // Promote staff to admin
      const promoteResponse = await request(app)
        .put(`/api/businessUsers/${businessUserId}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({ role: 'admin' })

      expect(promoteResponse.status).toBe(200)
      expect(promoteResponse.body.data.role).toBe('admin')

      // Demote admin to staff
      const demoteResponse = await request(app)
        .put(`/api/businessUsers/${businessUserId}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({ role: 'staff' })

      expect(demoteResponse.status).toBe(200)
      expect(demoteResponse.body.data.role).toBe('staff')

      // Verify role changes in staff list
      const staffListResponse = await request(app)
        .get(`/api/businessUsers/businesses/${businessId}/staff`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(staffListResponse.status).toBe(200)
      expect(staffListResponse.body.data.length).toBe(1)
    })
  })
})
