require('dotenv').config()

const DB_SCHEMA = process.env.DB_SCHEMA || 'public'
const DB_URL = process.env.DB_URL

module.exports = {
  DB_URL, DB_SCHEMA
}