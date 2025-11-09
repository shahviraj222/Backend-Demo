/**
 * Supabase client configuration and utilities
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

const supabaseUrl = process.env.SUPABASE_URL
// const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

/**
 * Generic API client for making requests to Supabase
 */
export class ApiClient {
  public client = supabase

  /**
   * Get current user session
   */
  async getSession(token: string) {
    const { data, error } = await this.client.auth.getUser(token)
    return { user: data.user, error }
  }

  /**
   * Sign in user
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  /**
   * Sign up user
   */
  async signUp(email: string, password: string) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  /**
   * Sign out user
   */
  async signOut() {
    const { error } = await this.client.auth.signOut()
    return { error }
  }

  /**
   * Generic query method
   */
  async query<T>(
    table: string,
    options: {
      select?: string
      eq?: Record<string, unknown>
      order?: { column: string; ascending?: boolean }
      limit?: number
      offset?: number
    } = {}
  ) {
    let query = this.client.from(table).select(options.select || '*')

    if (options.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    if (options.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? true,
      })
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await query
    return { data: data as T[], error, count }
  }

  /**
   * Generic insert method
   */
  async insert<T>(table: string, data: Partial<T>) {
    const { data: result, error } = await this.client
      .from(table)
      .insert(data)
      .select()
      .single()

    return { data: result as T, error }
  }

  /**
   * Generic update method
   */
  async update<T>(table: string, id: string, data: Partial<T>) {
    const { data: result, error } = await this.client
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single()

    return { data: result as T, error }
  }

  /**
   * Generic delete method
   */
  async delete(table: string, id: string) {
    const { error } = await this.client.from(table).delete().eq('id', id)

    return { error }
  }

  /**
   * Get single record by ID
   */
  async getById<T>(table: string, id: string, select?: string) {
    const { data, error } = await this.client
      .from(table)
      .select(select || '*')
      .eq('id', id)
      .single()

    return { data: data as T, error }
  }
}

export const apiClient = new ApiClient()
