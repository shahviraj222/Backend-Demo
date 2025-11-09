import { NextFunction, Request, Response } from 'express'
import { apiClient } from './client'
import { User } from '@supabase/supabase-js'
import { Action, ALL_PERMISSIONS, Resource } from './lib/permissions'

function censorPasswords<T extends Record<string, unknown>>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) return obj

  const redactedObj = Array.isArray(obj) ? ([] as unknown as T) : ({} as T)

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]

      if (typeof key === 'string' && key.toLowerCase().includes('password')) {
        redactedObj[key] = '********' as T[typeof key] // Redact password
      } else if (typeof value === 'object' && value !== null) {
        redactedObj[key] = censorPasswords(value as T) as T[typeof key] // Recurse for nested objects
      } else {
        redactedObj[key] = value
      }
    }
  }

  return redactedObj
}

const requestLogger = (request: Request, response: Response, next: NextFunction) => {
  console.info('Method: ', request.method)
  console.info('Path: ', request.path, 'Query: ', request.query)
  console.info('Body: ', censorPasswords(request.body))
  response.on('finish', () => {
    console.info('Status:', response.statusCode)
    console.info('---')
  })
  next()
}

const unknownEndpoint = (_request: Request, response: Response) => {
  response.status(404).send({ errors: ['Unknown endpoint'] })
}

const getUser = async (req: Request, res: Response): Promise<boolean> => {
  const token = req.headers.authorization?.split('Bearer ')[1]
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  const { user, error } = await apiClient.getSession(token)
  if (error) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  req.user = user as User | null
  return true
}

const checkForUser = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getUser(req, res)
  if (!result) {
    return
  }
  next()
}

const canAccessResource = (resource: Resource, action: Action) => {
  return async function (req: Request, res: Response, next: NextFunction) {
    const result = await getUser(req, res)
    if (!result) {
      return
    }
    const user = req.user as User
    if (!user.role) {
      res.status(403).json({ errors: ['You are not authorized to do this'] })
      return
    }
    let hasPermission = false

    const userRoles = user.role.split(',')
    
    // the current user does not have roles set up and are attached to another table instead.
    // So... For each type of permission, you would have to separately call the database to check things.
    // My recommendation would be to update the entire database to have a single role column.


    for (const role of userRoles) {
      const permissionsForRole = ALL_PERMISSIONS[role]
      if (permissionsForRole) {
        const allowedActionsForResource = permissionsForRole[resource]

        if (allowedActionsForResource && allowedActionsForResource.includes(action)) {
          hasPermission = true
          break
        }
      }
    }

    if (!hasPermission) {
      res.status(403).json({ errors: ['You are not authorized to do this'] })
      return
    }

    next()
  }
}

export default {
  requestLogger,
  unknownEndpoint,
  checkForUser,
  canAccessResource,
}
