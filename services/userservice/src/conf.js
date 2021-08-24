const { NODE_ENV, DB_URL, SECRET, TOKEN_SECRET } = process.env

// Sentry
const sentryRelease = process.env.SENTRY_RELEASE || ''
const sentryEnvironment = process.env.SENTRY_ENVIRONMENT || ''
const runningInCI = process.env.CI === 'true'

const isStaging = NODE_ENV === 'staging'

const courseStatisticsGroup = 'grp-oodikone-basic-users'

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
}
