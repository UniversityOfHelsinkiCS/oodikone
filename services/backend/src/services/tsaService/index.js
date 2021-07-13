const axios = require('axios')
const {
  ANALYTICS_INFLUXDB_URL,
  ANALYTICS_INFLUXDB_DB,
  ANALYTICS_INFLUXDB_PASSWORD,
  ANALYTICS_INFLUXDB_USER
} = require('../../conf-backend')
const lineProtocol = require('./influxLineSerializer.js')

/**
 * Note: if you're developing this locally,
 * copy the influxdb & grafana config from toskakone's docker-compose.yml
 * to docker-compose.dev.yml including the scripts in the
 * influxdb-init-scripts directory
 */

const TSA_ENABLED = !!(ANALYTICS_INFLUXDB_URL && ANALYTICS_INFLUXDB_DB)

/** @type {axios.AxiosInstance} */
const influxHttp = axios.create({
  baseURL: ANALYTICS_INFLUXDB_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  withCredentials: true,
  auth: null
})

/**
 * @param {{measurement: string, fields: {[key]: any}, tags?: {[key]: string}, timestamp?: Date }} obj
 */
const write = obj => {
  const payload = lineProtocol.serialize(obj)
  return influxHttp.post('/write', payload, {
    params: {
      db: ANALYTICS_INFLUXDB_DB,
      precision: 'ms' // date.getTime() timestamps
    },
    auth: {
      username: ANALYTICS_INFLUXDB_USER,
      password: ANALYTICS_INFLUXDB_PASSWORD
    }
  })
}

const sendTsaEvent = (userId, { group, name, label, value }) => {
  if (!TSA_ENABLED) {
    return Promise.resolve()
  }

  if (!value) {
    throw new Error('Value is required')
  }

  // note: influxdb line protocol supports multiple events per write
  // so if we need that in the future, it can be implemented instead of
  // looping
  return write({
    measurement: 'oodikone_tsa_event',
    tags: {
      userId,
      eventGroup: group,
      eventName: name,
      eventLabel: label
    },
    fields: {
      eventValue: value
    },
    timestamp: new Date()
  })
}

module.exports = { sendTsaEvent }
