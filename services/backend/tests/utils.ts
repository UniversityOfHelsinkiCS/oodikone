import express from 'express'
import { Response } from 'supertest'

import { baseUrl } from '../src/config'
import { initializeDatabaseConnection, dbConnections } from '../src/database/connection'
import routes from '../src/routes'

/** Override Supertest's Response body with our own type */
export type ResponseWithBody<T> = Omit<Response, 'body'> & { body: T }

export const initTests = async () => {
  // Copied from "app.ts"
  await initializeDatabaseConnection()

  void (await dbConnections.connect())

  dbConnections.on('connect', () => {
    console.info('Connected to sis db successfully (TEST)')
  })
  dbConnections.on('error', () => {
    console.error('Failed to connect to sis db! (TEST)')
  })
  dbConnections.on('close', () => {
    console.info('Closing connection... (TEST)')
  })

  const app = express()
  routes(app, baseUrl)

  return app
}
