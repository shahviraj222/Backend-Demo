import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import allRoutes from './routes/index'
import middlewares from './middlewares'

const app = express()

app.use(
  cors({
    credentials: true,
    methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    origin: true,
  })
)

app.use(helmet({ contentSecurityPolicy: false }))
app.use(express.json())
app.use(middlewares.requestLogger)

app.use('/api', allRoutes)

app.get('/', (_req, res) => {
  res.json({ message: 'Backend is running ✅' })
})

app.use(middlewares.unknownEndpoint)

export default app
