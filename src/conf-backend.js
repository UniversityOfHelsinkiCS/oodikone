require('dotenv').config()

const DB_URL = process.env.DB_URL
const frontend_addr = process.env.FRONT_URL
const redis = process.env.REDIS

module.exports = {
  frontend_addr, DB_URL, redis
}