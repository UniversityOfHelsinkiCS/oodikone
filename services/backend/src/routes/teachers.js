const router = require('express').Router()
const teacherV2 = require('../routesV2/teachers')
const useSisRouter = require('../util/useSisRouter')

module.exports = useSisRouter(teacherV2, router)
