const router = require('express').Router()
const tagsV2 = require('../routesV2/tags')
const useSisRouter = require('../util/useSisRouter')

module.exports = useSisRouter(tagsV2, router)
