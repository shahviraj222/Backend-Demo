import request from 'supertest'
import app from '../app'
import { TestHelper } from './helpers/testHelpers'
import { testData } from './helpers/testData'

describe('Authentication API', () => {
  beforeEach(async () => {
    await TestHelper.cleanup()
  })

  describe('POST /api/auth/signup', () => {
    it('should register a new regular user successfully', async () => {
      const userData = {
        ...testData.validUser,
        email: TestHelper.generateTestEmail(),
      }

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('session')
      expect(response.body).toHaveProperty('redirect_url')
      expect(response.body.user.email).toBe(userData.email)
      expect(response.body.redirect_url).toBe('https://app.metryai.com')
    })

    it('should register a new business user successfully', async () => {
      const userData = {
        ...testData.businessUser,
        email: TestHelper.generateTestEmail(),
      }

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('session')
      expect(response.body).toHaveProperty('redirect_url')
      expect(response.body.user.email).toBe(userData.email)
      expect(response.body.redirect_url).toBe('https://business.metryai.com/signup')
    })

    it('should reject invalid email format', async () => {
      const userData = {
        ...testData.validUser,
        email: testData.invalidData.invalidEmail,
      }

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Invalid email address')
    })

    it('should reject short password', async () => {
      const userData = {
        ...testData.validUser,
        email: TestHelper.generateTestEmail(),
        password: testData.invalidData.invalidPassword,
      }

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Password must be at least 6 characters')
    })

    it('should reject duplicate email', async () => {
      const userData = {
        ...testData.validUser,
        email: TestHelper.generateTestEmail(),
      }

      // Register first time
      await request(app)
        .post('/api/auth/signup')
        .send(userData)

      // Try to register again with same email
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/auth/login', () => {
    let registeredUser: any

    beforeEach(async () => {
      const userData = {
        ...testData.validUser,
        email: TestHelper.generateTestEmail(),
      }
      
      await request(app)
        .post('/api/auth/signup')
        .send(userData)
      
      registeredUser = userData
    })

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: registeredUser.email,
          password: registeredUser.password,
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('session')
      expect(response.body).toHaveProperty('redirect_url')
      expect(response.body.user.email).toBe(registeredUser.email)
    })

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: registeredUser.password,
        })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: registeredUser.email,
          password: 'wrongpassword',
        })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    it('should redirect business users to business dashboard', async () => {
      const businessUserData = {
        ...testData.businessUser,
        email: TestHelper.generateTestEmail(),
      }

      // Register business user
      await request(app)
        .post('/api/auth/signup')
        .send(businessUserData)

      // Login business user
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: businessUserData.email,
          password: businessUserData.password,
        })

      expect(response.status).toBe(200)
      expect(response.body.redirect_url).toBe('https://business.metryai.com')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toBe('Successfully logged out')
    })
  })
})
