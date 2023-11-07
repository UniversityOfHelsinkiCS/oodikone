const morgan = require('morgan')
const logger = require('../util/logger')
const _ = require('lodash')

// So this appears to be a hack to get neatly formatted stats like response-time etc. from morgan
// without actually using morgan what it's used for (LOGGING REQUESTS!).
// Return undefined from here so that stuff isn't printed to console
// so don't e.g. make it into an async function or it'll print [object Promise] on every request
const accessLogger = morgan((tokens, req, res) => {
  const fields = ['method', 'url', 'status', 'response-time', 'remote-addr', 'remote-user', 'user-agent', 'referrer']
  const { user } = req
  const meta = { ...user }
  fields.forEach(field => (meta[field] = tokens[field](req, res)))
  meta['time'] = tokens['date'](req, res, 'iso')
  if (req.route) {
    meta['req-route'] = req.route.path
  }

  const message = [
    user.name,
    tokens['method'](req, res),
    tokens['url'](req, res),
    tokens['status'](req, res),
    '-',
    tokens['response-time'](req, res),
    'ms',
  ].join(' ')

  const usingIamRights = user.iamRights.some(programmeCode => tokens['url'](req, res).includes(programmeCode))
  const onlyIamRights = !user.isAdmin && user.rights.length === 0

  logger.info(message, {
    // don't log student list which might be huge
    ..._.omit(meta, ['studentsUserCanAccess']),
    // pass this as a custom field so we can filter by it in graylog
    isUsageStats: true,
    // needed for Grafana IAM users panel
    isIamRights: onlyIamRights || usingIamRights,
  })
})

module.exports = accessLogger
