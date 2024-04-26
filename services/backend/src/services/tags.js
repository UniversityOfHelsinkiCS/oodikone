const { Op } = require('sequelize')
const { Tag } = require('../models/models_kone')

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
  createNewTag,
  findTagsByStudytrack,
  findTagsFromStudytrackById,
  deleteTag,
}
