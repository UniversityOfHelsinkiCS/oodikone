require('dotenv').config()

const { NODE_ENV } = process.env

const isTest = NODE_ENV === 'test'
const isDev = NODE_ENV === 'dev'
const isStaging = NODE_ENV === 'staging'

const DB_SCHEMA = isTest ? 'test' : (process.env.DB_SCHEMA || 'public')
const DB_URL = process.env.DB_URL

module.exports = {
  DB_URL, DB_SCHEMA,
  requiredGroup,
  isTest,
  isDev,
  isStaging
}