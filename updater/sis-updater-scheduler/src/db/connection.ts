import EventEmitter from 'events'
import knex from 'knex'

import {
  isDev,
  runningInCI,
  SIS_IMPORTER_HOST,
  SIS_IMPORTER_PORT,
  SIS_IMPORTER_USER,
  SIS_IMPORTER_PASSWORD,
  SIS_IMPORTER_DATABASE,
} from '../config'
import { logger } from '../utils/logger'

class KnexConnection extends EventEmitter {
  RETRY_ATTEMPTS = 15
  /** Creating the configuration cannot fail. The errors happen on the first query eg. this.connect() */
  knex = knex({
    client: 'pg',
    connection: {
      port: SIS_IMPORTER_PORT,
      host: SIS_IMPORTER_HOST,
      user: SIS_IMPORTER_USER,
      password: SIS_IMPORTER_PASSWORD,
      database: SIS_IMPORTER_DATABASE,
      ssl: !isDev && !runningInCI ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 0,
      max: 5,
    },
  })

  async connect(attempt = 1) {
    try {
      await this.knex.raw('select 1+1 as result')
      this.emit('connect')
      return true
    } catch (error) {
      if (attempt > this.RETRY_ATTEMPTS) {
        this.emit('error', error)
        return false
      }
      logger.error(`Knex database connection failed! Attempt ${attempt}/${this.RETRY_ATTEMPTS}`)
      logger.error(`Error while connecting: ${JSON.stringify(error, null, 2)}`)
      setTimeout(() => void this.connect(attempt + 1), 1000 * attempt)
    }

    // Should not get here!
    return false
  }
}

export const knexConnection = new KnexConnection()
