const { NODE_ENV, DB_URL, SECRET, TOKEN_SECRET, SENTRY_RELEASE, SENTRY_ENVIRONMENT, CI } = process.env

// Sentry
const sentryRelease = SENTRY_RELEASE || ''
const sentryEnvironment = SENTRY_ENVIRONMENT || ''
const runningInCI = CI === 'true'

const isStaging = NODE_ENV === 'staging'

const courseStatisticsGroup = 'grp-oodikone-basic-users'

const hyOneGroup = 'hy-one'

const requiredGroup = isStaging
  ? ['grp-oodikone-staging-users', 'grp-oodikone-basic-staging-users']
  : ['grp-oodikone-users', 'grp-oodikone-basic-users']

module.exports = {
  DB_URL,
  SECRET,
  TOKEN_SECRET,
  requiredGroup,
  courseStatisticsGroup,
  sentryRelease,
  sentryEnvironment,
  runningInCI,
  hyOneGroup,
}
