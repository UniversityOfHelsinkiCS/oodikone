require('dotenv').config()
const DB_SCHEMA = process.env.DB_SCHEMA || 'public'
const DB_URL = process.env.NODE_ENV === 'test' ? process.env.TEST_DB : process.env.DB_URL

module.exports = {
  DB_URL, DB_SCHEMA
}