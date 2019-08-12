const Sequelize = require('sequelize')
const { Tag, TagStudent } = require('../models/models_kone')

const Op = Sequelize.Op

const findTags = () => Tag.findAll({})

const findTagsByStudytrack = (studytrack) => {
  return Tag.findAll({
    where: {
      studytrack: {
        [Op.eq]: studytrack
      }
    }
  })
}

const createNewTag = async (tag) => {
  return Tag.create(tag)
}

const deleteTag = async (tag) => {
  await TagStudent.destroy({
    where: {
      tag_id: {
        [Op.eq]: tag.tag_id
      }
    }
  })
  return Tag.destroy({
    where: {
      tag_id: {
        [Op.eq]: tag.tag_id
      }
    }
  })
}

module.exports = {
  createNewTag,
  findTags,
  findTagsByStudytrack,
  deleteTag
}