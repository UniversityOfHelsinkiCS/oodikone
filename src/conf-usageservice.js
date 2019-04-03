const DB_SCHEMA = process.env.DB_SCHEMA ? process.env.DB_SCHEMA : 'public'
const DB_URL = process.env.DB_URL
const PORT = process.env.PORT
const SECRET = process.env.SECRET


module.exports = {
  DB_SCHEMA,
  DB_URL,
  PORT,
  SECRET
}