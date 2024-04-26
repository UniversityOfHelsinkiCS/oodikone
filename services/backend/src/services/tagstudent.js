const { Op } = require('sequelize')
const { TagStudent, Tag } = require('../models/models_kone')

const getStudentTagsByStudytrack = studytrack => {
  return TagStudent.findAll({
    include: {
      model: Tag,
      attributes: ['tag_id', 'tagname', 'personal_user_id'],
      where: {
        studytrack: {
          [Op.eq]: studytrack,
        },
      },
    },
  })
}

const createStudentTag = async tag => {
  return TagStudent.create(tag)
}

const createMultipleStudentTags = async tags => {
  return TagStudent.bulkCreate(tags, { ignoreDuplicates: true })
}

const deleteMultipleStudentTags = async (tagId, studentnumbers) => {
  return TagStudent.destroy({
    where: {
      tag_id: {
        [Op.eq]: tagId,
      },
      studentnumber: {
        [Op.in]: studentnumbers,
      },
    },
  })
}

module.exports = {
  getStudentTagsByStudytrack,
  createStudentTag,
  createMultipleStudentTags,
  deleteMultipleStudentTags,
}
