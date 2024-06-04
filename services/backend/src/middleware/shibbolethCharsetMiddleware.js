const headersMiddleware = require('unfuck-utf8-headers-middleware')

const serviceProvider = require('../conf-backend')

const headers =
  serviceProvider === 'Toska'
    ? ['uid', 'displayName', 'shib-session-id', 'hyGroupCn', 'mail', 'hyPersonSisuId']
    : ['remote_user']

module.exports = headersMiddleware(headers)
