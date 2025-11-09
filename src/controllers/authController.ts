import { Request, Response } from 'express'
import { supabase } from '../client' // Assuming '../client' is the correct path for your Supabase instance
import { z } from 'zod'

// Zod schema for user signup
export const SignUpSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long.' }),
  user_type: z
    .enum(['regular', 'business'], {
      message: "User type must be 'regular' or 'business'.",
    })
    .default('regular')
    .optional(), // Optional with a default
  redirect_to: z.string().optional().default('app'), // Optional with a default
})

// Zod schema for user login
export const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }), // Min 1 as it's just a presence check here, actual length validation is handled by Supabase
  redirect_to: z.string().optional().default('app'), // Optional with a default
})

// Zod schema for completing user profile (step 2)
export const CompleteProfileSchema = z.object({
  user_id: z.string({ message: 'User ID is required.' }),
  first_name: z.string().min(1, { message: 'First name is required.' }),
  last_name: z.string().optional(),
  phone: z.string().optional(),
})

export class AuthController {
  private static determineRedirectUrl(
    userType: string,
    redirectTo: string,
    isNewUser: boolean
  ): string {
    if (userType === 'business') {
      if (isNewUser) {
        return 'https://business.metryai.com/signup'
      } else {
        return 'https://business.metryai.com'
      }
    }

    if (redirectTo === 'business') {
      return 'https://business.metryai.com'
    } else if (redirectTo === 'business/signup') {
      return 'https://business.metryai.com/signup'
    }

    return 'https://app.metryai.com'
  }

  static async signUp(req: Request, res: Response): Promise<void> {
    const parsedBody = SignUpSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const { email, password, user_type, redirect_to } = parsedBody.data

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type,
          },
        },
      })

      if (error) {
        res.status(400).json({ error: error.message })
        return
      }

      if (data.user) {
        const redirectUrl = AuthController.determineRedirectUrl(
          user_type || 'regular',
          redirect_to,
          true
        )

        res.status(201).json({
          user: data.user,
          session: data.session,
          redirect_url: redirectUrl,
        })
      } else {
        res.status(400).json({ error: 'Failed to create user' })
      }
    } catch (error) {
      console.error('Signup error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    const parsedBody = LoginSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const { email, password, redirect_to } = parsedBody.data

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        res.status(401).json({ error: error.message })
        return
      }

      if (data.user) {
        const userMetadata = data.user.user_metadata || {}
        const userType = userMetadata.user_type || 'regular'

        const redirectUrl = AuthController.determineRedirectUrl(
          userType,
          redirect_to,
          false
        )

        res.status(200).json({
          user: data.user,
          session: data.session,
          redirect_url: redirectUrl,
        })
      } else {
        res.status(401).json({ error: 'Invalid credentials' })
      }
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        res.status(400).json({ error: error.message })
        return
      }

      res.status(200).json({ message: 'Successfully logged out' })
    } catch (error) {
      console.error('Logout error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  // ---------------------------------------------------------------
  // New: Complete Profile after signup (step 2)
  // ---------------------------------------------------------------
  static async completeProfile(req: Request, res: Response): Promise<void> {
    const parsedBody = CompleteProfileSchema.safeParse(req.body)

    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues.map(issue => issue.message).join('. ') })
      return
    }

    const { user_id, first_name, last_name, phone } = parsedBody.data

    try {
      const fullName = [first_name, last_name].filter(Boolean).join(' ') || first_name

      // Insert into profiles table
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          is_guest: false,
        })
        .eq('id', user_id)
        .select()
        .single()

      if (error) {
        console.error('Profile updation error:', error)
        res.status(500).json({ error: 'Failed to create user profile' })
        return
      }

      res.status(201).json({
        success: true,
        message: 'Profile is completed successfully',
        profile: data,
      })
    } catch (error) {
      console.error('Complete profile error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
