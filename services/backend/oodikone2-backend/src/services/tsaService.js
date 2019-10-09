const Influx = require('influx')
const { ANALYTICS_INFLUXDB_URL } = require('../conf-backend')

const influx = ANALYTICS_INFLUXDB_URL ? new Influx.InfluxDB(ANALYTICS_INFLUXDB_URL) : null

const sendTsaEvent = (userId, { group, name, label, value }) => {
  if (!ANALYTICS_INFLUXDB_URL) {
    return Promise.resolve()
  }

  let fields = {}
  if (label) fields.event_label = label
  if (value) fields.event_value = value

  return influx.writeMeasurement('tsa_event', [
    {
      timestamp: new Date(),
      tags: { userId, event_group: group, event_name: name },
      fields: fields
    }
  ])
}

module.exports = { sendTsaEvent }
