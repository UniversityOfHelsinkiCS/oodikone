const Transport = require('winston-transport')
const uuid = require('uuid')
const { UsageStatistic } = require('../models')

module.exports = class LogSaverTransport extends Transport {
  async log(payload, callback) {
    try {
      if (payload.url && payload.method) {
        const object = {
          id: uuid.v4(),
          username: payload.userId,
          name: payload.name,
          admin: payload.roles ? payload.roles.map(r => r.group_code).includes('admin') : false,
          time: payload.iat,
          method: payload.method,
          URL: payload.url,
          status: payload.status,
          data: payload
        }

        await UsageStatistic.create(object)
      }
    } catch (e) {
      console.log(e, payload)
    }
    callback()
  }
}
