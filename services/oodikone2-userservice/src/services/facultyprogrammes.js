const { FacultyProgrammes } = require('../models/index')

const findAll = () => FacultyProgrammes.findAll()

module.exports = { findAll }