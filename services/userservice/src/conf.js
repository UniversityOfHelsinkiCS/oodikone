const { NODE_ENV, DB_URL, SECRET, TOKEN_SECRET } = process.env

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
}
