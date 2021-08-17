const router = require('express').Router()
const semestersV2 = require('../routesV2/semesters')
const useSisRouter = require('../util/useSisRouter')

module.exports = useSisRouter(semestersV2, router)
