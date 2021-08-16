const router = require('express').Router()
const elementDetailsV2 = require('../routesV2/elementdetails')
const useSisRouter = require('../util/useSisRouter')
module.exports = useSisRouter(elementDetailsV2, router)
