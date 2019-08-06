const stan = require('node-nats-streaming').connect('updaterNATS', process.env.NATS_CLIENTID || 'scheduler', { url: process.env.NATS_URI })
module.exports = { stan }