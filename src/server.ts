import 'dotenv/config'
import { createServer } from 'node:http'

import app from './app'

const PORT = process.env.PORT || 3001

const server = createServer(app)

const start = async () => {
  server.listen(PORT, () => {
    console.info(`Server is running on port ${PORT}`)
  })
}
void start()
