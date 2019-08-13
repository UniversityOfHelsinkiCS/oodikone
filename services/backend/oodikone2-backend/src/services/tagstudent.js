const Sequelize = require('sequelize')
const { TagStudent, Tag } = require('../models/models_kone')

const Op = Sequelize.Op

const getStudentTags = () => TagStudent.findAll({})

const getStudentTagsByStudytrack = (studytrack) => {
  return TagStudent.findAll({
    include: {
      model: Tag,
      attributes: ['tag_id', 'tagname'],
      where: {
        studytrack: {
          [Op.eq]: studytrack
        }
      }
    }
  })
}

const getStudentTagsByStudentnumber = async (studentnumber) => {
  return TagStudent.findAll({
    where: {
      studentnumber: {
        [Op.eq]: studentnumber
      }
    }
  })
}

const createStudentTag = async (tag) => {
  return TagStudent.create(tag)
}

const createMultipleStudentTags = async (tags) => {
  return TagStudent.bulkCreate(tags)
}

const deleteStudentTag = async (id) => {
  return TagStudent.destroy({
    where: {
      id: {
        [Op.eq]: id
      }
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