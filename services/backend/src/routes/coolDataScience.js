const router = require('express').Router()
const useSisRouter = require('../util/useSisRouter')
const trendsV2 = require('../routesV2/trends')

module.exports = useSisRouter(trendsV2, router)
