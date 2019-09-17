const Sequelize = require('sequelize')
const { TagStudent, Tag } = require('../models/models_kone')

const Op = Sequelize.Op

const getStudentTags = () => TagStudent.findAll({})

const getStudentTagsByStudytrack = studytrack => {
  return TagStudent.findAll({
    include: {
      model: Tag,
      attributes: ['tag_id', 'tagname', 'personal_user_id'],
      where: {
        studytrack: {
          [Op.eq]: studytrack
        }
      }
    }
  })
}

const getStudentTagsByStudentnumber = async studentnumber => {
  return TagStudent.findAll({
    where: {
      studentnumber: {
        [Op.eq]: studentnumber
      }
    },
    include: {
      model: Tag,
      attributes: ['tag_id', 'tagname', 'personal_user_id']
    }
  })
}

const createStudentTag = async tag => {
  return TagStudent.create(tag)
}

const createMultipleStudentTags = async tags => {
  return TagStudent.bulkCreate(tags, { ignoreDuplicates: true })
}

const deleteStudentTag = async (studentnumber, tag_id) => {
  return TagStudent.destroy({
    where: {
      tag_id,
      studentnumber
    }
  })
}

module.exports = {
  getStudentTags,
  getStudentTagsByStudentnumber,
  getStudentTagsByStudytrack,
  createStudentTag,
  createMultipleStudentTags,
  deleteStudentTag
}
