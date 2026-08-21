import express from 'express'
import { Response } from 'supertest'

import { baseUrl, silentTesting } from '@/config'
import { initializeDatabaseConnection, dbConnections } from '@/database/connection'
import routes from '@/routes'
import logger from '@/util/logger'

/** Override Supertest's Response body with our own type */
export type ResponseWithBody<T> = Omit<Response, 'body'> & { body: T }

export const initTests = async (silent = silentTesting) => {
  /** Enable or disable logging from app */
  logger.silent = silent

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
