const Sequelize = require('sequelize')
const { TagStudent } = require('../models')

const getStudentTags = () => TagStudent.findAll({})

module.exports = {
  getStudentTags
}