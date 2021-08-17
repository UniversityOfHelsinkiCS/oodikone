const router = require('express').Router()

const populationV2 = require('../routesV2/population')
const useSisRouter = require('../util/useSisRouter')

module.exports = useSisRouter(populationV2, router)
