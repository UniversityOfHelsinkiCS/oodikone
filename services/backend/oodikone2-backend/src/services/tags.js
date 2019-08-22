const Sequelize = require('sequelize')
const { Tag } = require('../models/models_kone')

const Op = Sequelize.Op

const findTags = () => Tag.findAll({})

const findTagsByStudytrack = async (studytrack) => {
  return Tag.findAll({
    where: {
      studytrack: {
        [Op.eq]: studytrack
      }
    }
  })
}

const findTagsFromStudytrackById = async (studytrack, tag_ids) => {
  return Tag.findAll({
    where: {
      studytrack,
      tag_id: {
        [Op.in]: tag_ids
      }
    }
  })
}

const createNewTag = async (tag) => {
  return Tag.create(tag)
}

const deleteTag = async (tag) => {
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
  findTagsFromStudytrackById,
  deleteTag
}