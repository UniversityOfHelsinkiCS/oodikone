const { Op } = require('sequelize')
const { Tag } = require('../models/models_kone')

const findTagById = tag_id =>
  Tag.findOne({
    where: {
      tag_id,
    },
  })

const findTags = () => Tag.findAll({})

const findTagsByStudytrack = async studytrack => {
  return Tag.findAll({
    where: {
      studytrack: {
        [Op.eq]: studytrack,
      },
    },
  })
}

const findTagsFromStudytrackById = async (studytrack, tag_ids) => {
  return Tag.findAll({
    where: {
      studytrack,
      tag_id: {
        [Op.in]: tag_ids,
      },
    },
  })
}

const createNewTag = async tag => {
  if (Number.isNaN(tag.year)) {
    const newTag = {
      ...tag,
      year: null,
    }
    return Tag.create(newTag)
  }
  return Tag.create(tag)
}

const deleteTag = async tag => {
  return Tag.destroy({
    where: {
      tag_id: {
        [Op.eq]: tag.tag_id,
      },
    },
  })
}

module.exports = {
  findTagById,
  createNewTag,
  findTags,
  findTagsByStudytrack,
  findTagsFromStudytrackById,
  deleteTag,
}
