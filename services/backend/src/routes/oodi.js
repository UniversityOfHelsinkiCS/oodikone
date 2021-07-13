const axios = require('axios')
const https = require('https')
const fs = require('fs')
const { wrapper, router } = require('./router').routerWithWrapper()
const { KEY_PATH, CERT_PATH, OODI_ADDR, OODI_SECRET, OODI_SECRET_HEADER_KEY } = require('../conf-backend')
const logger = require('../util/logger')

const agent =
  KEY_PATH && CERT_PATH
    ? new https.Agent({
        cert: fs.readFileSync(CERT_PATH, 'utf8'),
        key: fs.readFileSync(KEY_PATH, 'utf8'),
      })
    : new https.Agent({
        rejectUnauthorized: false,
      })

const instance = axios.create({
  httpsAgent: agent,
})

const getUrl = instance.get

const getOodiApi = async relative => {
  const route = OODI_ADDR + relative
  const stuff = await getUrl(route)
  return stuff
}

const validOodApiRequest = request => {
  const secret = request.headers[OODI_SECRET_HEADER_KEY]
  return !!OODI_SECRET && OODI_SECRET === secret
}

wrapper.post('', async (req, res) => {
  const valid = validOodApiRequest(req)
  if (!valid) {
    return res.status(401).send()
  }
  const { route } = req.body
  try {
    const oodiApiResponse = await getOodiApi(route)
    res.json(oodiApiResponse.data.data)
  } catch (error) {
    logger.error(error)
    res.status(500).send()
  }
})

module.exports = router
