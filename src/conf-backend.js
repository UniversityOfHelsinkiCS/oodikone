require('dotenv').config()

const DB_URL = process.env.NODE_ENV === 'test' ? process.env.TEST_DB : process.env.DB_URL
const frontend_addr = process.env.FRONT_URL
const redis = process.env.REDIS

module.exports = {
  frontend_addr, DB_URL, redis
}