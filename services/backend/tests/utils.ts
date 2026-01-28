import express from 'express'

import { baseUrl } from '../src/config'
import { initializeDatabaseConnection, dbConnections } from '../src/database/connection'
import routes from '../src/routes'

export const initTests = async () => {
  // Copied from "app.ts"
  await initializeDatabaseConnection()

  void (await dbConnections.connect())

  dbConnections.on('connect', () => {
    console.info('Connected to sis db successfully')
  })
  dbConnections.on('error', () => {
    console.error('Failed to connect to sis db!')
  })

  const app = express()
  routes(app, baseUrl)

  return app
}
