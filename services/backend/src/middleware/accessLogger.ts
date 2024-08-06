import { Request, Response } from 'express'
import { omit } from 'lodash'
import morgan from 'morgan'

import { FormattedUser } from '../types'
import { getFullStudyProgrammeRights } from '../util'
import logger from '../util/logger'

interface Meta extends FormattedUser {
  method?: string
  url?: string
  status?: string
  'response-time'?: string
  'remote-addr'?: string
  'remote-user'?: string | undefined
  'user-agent'?: string
  referrer?: string
  time?: string
  'req-route'?: string
}

// So this appears to be a hack to get neatly formatted stats like response-time etc. from morgan
// without actually using morgan what it's used for (LOGGING REQUESTS!).
// Return undefined from here so that stuff isn't printed to console
// so don't e.g. make it into an async function or it'll print [object Promise] on every request
const accessLogger = morgan((tokens, req: Request, res: Response): undefined => {
  const fields = ['method', 'url', 'status', 'response-time', 'remote-addr', 'remote-user', 'user-agent', 'referrer']
  const { user } = req
  if (!user) {
    return
  }
  const meta: Meta = { ...user }
  fields.forEach(field => {
    meta[field] = tokens[field](req, res)
  })
  meta.time = tokens.date(req, res, 'iso')
  if (req.route) {
    meta['req-route'] = req.route.path
  }

  const message = [
    `${user.mockedBy ? '(mocking) ' : ''}${user.name}`,
    `${(tokens['response-time'](req, res) || '0').split('.')[0]} ms`.padEnd(8, ' '),
    tokens.status(req, res),
    tokens.method(req, res),
    decodeURIComponent(tokens.url(req, res) as string),
  ].join(' ')

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(user.programmeRights)
  const iamBasedRights = user.programmeRights.filter(right => right.isIamBased)
  const usingIamRights = iamBasedRights.some(right => (tokens.url(req, res) as string).includes(right.code))
  const onlyIamRights = !user.isAdmin && fullStudyProgrammeRights.length === 0

  logger.info(message, {
    ...omit(meta, ['studentsUserCanAccess']), // Don't log student list which might be huge
    isUsageStats: true, // Pass this as a custom field so we can filter by it in Graylog
    isIamRights: onlyIamRights || usingIamRights, // Needed for Grafana IAM users panel
  })
})

export default accessLogger
