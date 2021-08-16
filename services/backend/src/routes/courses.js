const router = require('express').Router()
const coursesV2 = require('../routesV2/courses')
const useSisRouter = require('../util/useSisRouter')

module.exports = useSisRouter(coursesV2, router)
