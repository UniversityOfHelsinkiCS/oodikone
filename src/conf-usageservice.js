const PORT = process.env.PORT
const DB_URL = process.env.DB_URL
const DB_SCHEMA = process.env.DB_SCHEMA ? process.env.DB_SCHEMA : 'public'

module.exports = {
  PORT,
  DB_URL,
  DB_SCHEMA
}