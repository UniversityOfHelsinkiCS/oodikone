const { wrapper, router } = require('./router').routerWithWrapper()
const { getOodiApi } = require('../services/doo_api_database_updater/oodi_interface')
const { OODI_SECRET, OODI_SECRET_HEADER_KEY } = require('../conf-backend')
import logger from '../util/logger'

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