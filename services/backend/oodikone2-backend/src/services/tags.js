const Sequelize = require('sequelize')
const { Tag } = require('../models')

const Op = Sequelize.Op

const findTags = () => Tag.findAll({})

const createNewTag = async (tag) => {
  return Tag.create(tag)
}

module.exports = {
  createNewTag,
  findTags
}