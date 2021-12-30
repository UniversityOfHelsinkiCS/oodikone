const headersMiddleware = require('unfuck-utf8-headers-middleware')

const headers = ['uid', 'displayName', 'shib-session-id', 'hyGroupCn', 'mail', 'hyPersonSisuId']

module.exports = headersMiddleware(headers)
