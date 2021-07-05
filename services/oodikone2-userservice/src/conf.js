require('dotenv').config()

const { NODE_ENV, DB_URL } = process.env

const isDev = NODE_ENV === 'development'
const isStaging = NODE_ENV === 'staging'

const courseStatisticsGroup = 'grp-oodikone-basic-users'

let requiredGroup = ['grp-oodikone-users', 'grp-oodikone-basic-users']
if (isStaging) {
  requiredGroup = ['grp-oodikone-staging-users', 'grp-oodikone-basic-staging-users']
}
if (isDev) {
  requiredGroup = null
}

module.exports = {
  DB_URL,
  requiredGroup,
  courseStatisticsGroup
}