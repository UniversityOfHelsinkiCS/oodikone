require('dotenv').config()

const DB_URL = process.env.NODE_ENV === 'test' ? process.env.TEST_DB : process.env.DB_URL
const frontend_addr = process.env.FRONT_URL
const redis = process.env.REDIS
const TOKEN_SECRET = process.env.TOKEN_SECRET
const DB_SCHEMA = process.env.DB_SCHEMA || 'public'
const OODI_ADDR = process.env.NODE_ENV === 'test' ? process.env.OODI_ADDR_TEST : process.env.OODI_ADDR

module.exports = {
  frontend_addr, DB_URL, redis, TOKEN_SECRET, DB_SCHEMA, OODI_ADDR
}