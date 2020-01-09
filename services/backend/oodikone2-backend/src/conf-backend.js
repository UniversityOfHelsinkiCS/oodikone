require('dotenv').config()

const { NODE_ENV } = process.env
const isTest = process.env.NODE_ENV === 'test'
let DB_URL = process.env.DB_URL
let DB_URL_KONE = process.env.DB_URL_KONE
if (isTest) {
  DB_URL = process.env.TEST_DB
  DB_URL_KONE = process.env.TEST_DB_KONE
} else if (NODE_ENV === 'anon') {
  DB_URL = process.env.ANON_DB
  DB_URL_KONE = process.env.ANON_DB_KONE
}

let DB_MAX_CONNECTIONS = parseInt(process.env.DB_MAX_CONNECTIONS, 10)
if (isNaN(DB_MAX_CONNECTIONS)) {
  DB_MAX_CONNECTIONS = 5 // sequelize's default
}

const frontend_addr = process.env.FRONT_URL
const redis = process.env.REDIS
const TOKEN_SECRET = process.env.TOKEN_SECRET
const DB_SCHEMA = process.env.DB_SCHEMA || 'public'
const DB_SCHEMA_KONE = process.env.DB_SCHEMA_KONE || 'public'
const CERT_PATH = process.env.CERT_PATH // production/staging only
const KEY_PATH = process.env.KEY_PATH // production/staging only
const USERSERVICE_URL = process.env.USERSERVICE_URL
const UPDATER_URL = process.env.UPDATER_URL
const USAGESERVICE_URL = process.env.USAGESERVICE_URL
const ANALYTICS_URL = process.env.ANALYTICS_URL
const PORT = isTest ? 8079 : 8080
const OODI_SECRET = process.env.OODI_SECRET
const ANALYTICS_INFLUXDB_URL = process.env.ANALYTICS_INFLUXDB_URL
const ANALYTICS_INFLUXDB_USER = process.env.ANALYTICS_INFLUXDB_USER
const ANALYTICS_INFLUXDB_PASSWORD = process.env.ANALYTICS_INFLUXDB_PASSWORD
const ANALYTICS_INFLUXDB_DB = process.env.ANALYTICS_INFLUXDB_DB
const MATOMO_SITE_ID = process.env.MATOMO_SITE_ID
const MATOMO_URL = process.env.MATOMO_URL

const FEATURES = {
  ERROR_HANDLER: false
}

const formatURL = url => {
  return !!url && !url.startsWith('http') ? `http://${url}` : url
}

const addSlashToEnd = url => (url.endsWith('/') ? url : url + '/')

if (process.env.NODE_ENV === 'dev' && process.env.FEATURES) {
  const toggled = process.env.FEATURES.split(',')
  toggled
    .map(toggle => toggle.trim())
    .forEach(feature => {
      if (FEATURES[feature] !== undefined) {
        FEATURES[feature] = true
      }
    })
}

const OODI = {
  test: 'http://localhost',
  anon: process.env.OODI_ADDR_ANON
}

const OODI_ADDR = OODI[process.env.NODE_ENV] || process.env.OODI_ADDR
const ACCESS_TOKEN_HEADER_KEY = 'x-access-token'
const OODI_SECRET_HEADER_KEY = 'x-oodi-secret'

let requiredGroup = 'grp-oodikone-users'
if (process.env.NODE_ENV === 'staging') {
  requiredGroup = 'grp-oodikone-staging-users'
}
if (process.env.NODE_ENV === 'dev' || isTest) {
  requiredGroup = null
}

module.exports = {
  frontend_addr,
  DB_URL,
  DB_URL_KONE,
  DB_MAX_CONNECTIONS,
  redis,
  TOKEN_SECRET,
  DB_SCHEMA,
  DB_SCHEMA_KONE,
  OODI_ADDR,
  CERT_PATH,
  KEY_PATH,
  FEATURES,
  USERSERVICE_URL: formatURL(USERSERVICE_URL),
  ACCESS_TOKEN_HEADER_KEY,
  PORT,
  ANALYTICS_URL: formatURL(ANALYTICS_URL),
  USAGESERVICE_URL,
  requiredGroup,
  OODI_SECRET,
  OODI_SECRET_HEADER_KEY,
  isTest,
  UPDATER_URL,
  ANALYTICS_INFLUXDB_URL: formatURL(ANALYTICS_INFLUXDB_URL),
  ANALYTICS_INFLUXDB_USER,
  ANALYTICS_INFLUXDB_PASSWORD,
  ANALYTICS_INFLUXDB_DB,
  MATOMO_SITE_ID,
  MATOMO_URL: MATOMO_URL && addSlashToEnd(MATOMO_URL)
}
