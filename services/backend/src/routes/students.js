const router = require('express').Router()
const studentsV2 = require('../routesV2/students')
const useSisRouter = require('../util/useSisRouter')

module.exports = useSisRouter(studentsV2, router)
