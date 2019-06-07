const Sequelize = require('sequelize')
const { TagStudent } = require('../models')

const Op = Sequelize.Op

const getStudentTags = () => TagStudent.findAll({})

const createStudentTag = async (tag) => {
  return TagStudent.create(tag)
}

const deleteStudentTag = async (tag) => {
  return TagStudent.destroy({
    where: {
      tag_id: {
        [Op.eq]: tag.tag_id
      }
    }
  })
}

module.exports = {
  getStudentTags,
  createStudentTag,
  deleteStudentTag
}