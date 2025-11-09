import path from 'path'
import { Router } from 'express'

import { fileURLToPath, pathToFileURL } from 'url'
import { requireFilesInDir } from '../utils/file_helper'

const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Register all routes using the file name as the base path
// Ex: app/routes/users.ts -> the base path for all endpoints is: /users
requireFilesInDir({
  dirName: __dirname,
  fileNamesToExclude: ['index.ts'],
  requireFunction: async (filePath: string) => {
    try {
      const moduleUrl = pathToFileURL(filePath).href
      const imported = await import(moduleUrl)
      const theRouter = imported.default
      const routeBasePath = path.basename(filePath, '.ts')
      router.use(`/${routeBasePath}`, theRouter)
    } catch (err) {
      console.error(`Exception while trying to load route file: ${filePath}\n${err}`)
    }
  },
})

export default router
